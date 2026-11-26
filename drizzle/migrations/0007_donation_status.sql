-- Fim do ciclo da adoção: o abrigo conclui ou cancela a doação.
--   concluída -> o pet vira 'adotado' (sai da tela inicial) e os outros pedidos pendentes são recusados
--   cancelada -> o pet volta a 'disponivel' para novos pedidos

-- 1) Novos valores de status (remove as regras antigas pelo conteúdo, qualquer que seja o nome)
DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conrelid::regclass AS t, conname FROM pg_constraint
    WHERE contype = 'c' AND (
      (conrelid = 'public.pets'::regclass AND pg_get_constraintdef(oid) ILIKE '%em_processo%') OR
      (conrelid = 'public.adoption_requests'::regclass AND pg_get_constraintdef(oid) ILIKE '%pendente%'))
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.t, c.conname);
  END LOOP;
END $$;
ALTER TABLE public.pets ADD CONSTRAINT pets_status_check CHECK (status IN ('disponivel', 'em_processo', 'adotado'));
ALTER TABLE public.adoption_requests ADD CONSTRAINT adoption_requests_status_check
  CHECK (status IN ('pendente', 'aprovada', 'recusada', 'concluida', 'cancelada'));

-- 2) O abrigo pode mudar o pedido recebido para os novos status
DROP POLICY IF EXISTS "shelter decides received" ON public.adoption_requests;
CREATE POLICY "shelter decides received" ON public.adoption_requests FOR UPDATE TO authenticated
  USING (shelter_id = auth.uid()::text)
  WITH CHECK (shelter_id = auth.uid()::text AND status IN ('aprovada', 'recusada', 'concluida', 'cancelada'));

-- 3) Só são aceitas transições válidas, e um pet só pode ter um pedido aprovado por vez
CREATE OR REPLACE FUNCTION public.check_request_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF OLD.status = 'pendente' AND NEW.status IN ('aprovada', 'recusada') THEN
    IF NEW.status = 'aprovada' AND EXISTS (
      SELECT 1 FROM public.adoption_requests WHERE pet_id = NEW.pet_id AND status = 'aprovada' AND id <> NEW.id
    ) THEN RAISE EXCEPTION 'já existe um pedido aprovado para este pet'; END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'aprovada' AND NEW.status IN ('concluida', 'cancelada') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'mudança de status inválida: % -> %', OLD.status, NEW.status;
END $$;
DROP TRIGGER IF EXISTS adoption_requests_check_transition ON public.adoption_requests;
CREATE TRIGGER adoption_requests_check_transition BEFORE UPDATE OF status ON public.adoption_requests
  FOR EACH ROW EXECUTE FUNCTION public.check_request_transition();

-- 4) Efeito no pet (substitui a função do gatilho que já existia para a aprovação)
CREATE OR REPLACE FUNCTION public.on_request_approved() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'aprovada' THEN
    UPDATE public.pets SET status = 'em_processo' WHERE id::text = NEW.pet_id;
  ELSIF NEW.status = 'concluida' THEN
    UPDATE public.pets SET status = 'adotado' WHERE id::text = NEW.pet_id;
    UPDATE public.adoption_requests SET status = 'recusada' WHERE pet_id = NEW.pet_id AND id <> NEW.id AND status = 'pendente';
  ELSIF NEW.status = 'cancelada' THEN
    UPDATE public.pets SET status = 'disponivel' WHERE id::text = NEW.pet_id;
  END IF;
  RETURN NEW;
END $$;

-- 5) Tela inicial dos tutores atualiza sozinha quando o status do pet muda
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pets;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
