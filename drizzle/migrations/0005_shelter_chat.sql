CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abrigo_id uuid NOT NULL,
  adotante_id uuid NOT NULL DEFAULT auth.uid(),
  animal_id text NOT NULL,
  abrigo_nome text NOT NULL DEFAULT '',
  adotante_nome text NOT NULL DEFAULT '',
  animal_nome text NOT NULL DEFAULT '',
  ultima_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (abrigo_id, adotante_id, animal_id)
);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL DEFAULT auth.uid(),
  texto text NOT NULL CHECK (length(texto) BETWEEN 1 AND 2000),
  criada_em timestamptz NOT NULL DEFAULT now(),
  lida boolean NOT NULL DEFAULT false
);
CREATE INDEX messages_conv_idx ON public.messages(conversa_id, criada_em);
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT UPDATE (lida) ON public.messages TO authenticated;
GRANT ALL ON public.conversations, public.messages TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conv_member(_conv uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = _conv AND (c.abrigo_id = auth.uid() OR c.adotante_id = auth.uid()))
$$;

CREATE POLICY "conv members read" ON public.conversations FOR SELECT TO authenticated USING (abrigo_id = auth.uid() OR adotante_id = auth.uid());
CREATE POLICY "conv adopter creates" ON public.conversations FOR INSERT TO authenticated WITH CHECK (adotante_id = auth.uid());
CREATE POLICY "msg members read" ON public.messages FOR SELECT TO authenticated USING (public.is_conv_member(conversa_id));
CREATE POLICY "msg members send" ON public.messages FOR INSERT TO authenticated WITH CHECK (remetente_id = auth.uid() AND public.is_conv_member(conversa_id) AND lida = false);
CREATE POLICY "msg recipient marks read" ON public.messages FOR UPDATE TO authenticated USING (public.is_conv_member(conversa_id) AND remetente_id <> auth.uid()) WITH CHECK (public.is_conv_member(conversa_id));

-- Fill shelter/pet/adopter data from trusted sources
CREATE OR REPLACE FUNCTION public.conv_fill() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; n text;
BEGIN
  SELECT * INTO p FROM public.pets WHERE id::text = NEW.animal_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'animal não encontrado'; END IF;
  NEW.abrigo_id := p.shelter_user_id;
  NEW.abrigo_nome := coalesce(nullif(p.shelter_name, ''), 'Abrigo');
  NEW.animal_nome := p.name;
  SELECT name INTO n FROM public.profiles WHERE id = NEW.adotante_id;
  NEW.adotante_nome := coalesce(nullif(n, ''), 'Interessado');
  RETURN NEW;
END $$;
CREATE TRIGGER conversations_fill BEFORE INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.conv_fill();

CREATE OR REPLACE FUNCTION public.conv_welcome() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.messages (conversa_id, remetente_id, texto, lida, criada_em)
  VALUES (NEW.id, NEW.abrigo_id, 'Seja bem-vindo ao ' || NEW.abrigo_nome || '! Vi que deseja falar sobre o nosso amigo ' || NEW.animal_nome || ', certo?', true, now() - interval '1 second');
  RETURN NEW;
END $$;
CREATE TRIGGER conversations_welcome AFTER INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.conv_welcome();

CREATE OR REPLACE FUNCTION public.msg_touch_conv() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET ultima_em = NEW.criada_em WHERE id = NEW.conversa_id;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_touch AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.msg_touch_conv();

-- Adoption interest opens a conversation automatically
CREATE OR REPLACE FUNCTION public.request_open_conv() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; pname text;
BEGIN
  SELECT name INTO pname FROM public.pets WHERE id::text = NEW.pet_id;
  IF pname IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.conversations (adotante_id, animal_id, abrigo_id) VALUES (NEW.user_id, NEW.pet_id, NEW.shelter_id::uuid)
  ON CONFLICT (abrigo_id, adotante_id, animal_id) DO NOTHING RETURNING id INTO cid;
  IF cid IS NULL THEN
    SELECT id INTO cid FROM public.conversations WHERE adotante_id = NEW.user_id AND animal_id = NEW.pet_id LIMIT 1;
  END IF;
  INSERT INTO public.messages (conversa_id, remetente_id, texto) VALUES (cid, NEW.user_id, 'Tenho interesse em adotar ' || pname || '.');
  RETURN NEW;
END $$;
CREATE TRIGGER adoption_requests_open_conv AFTER INSERT ON public.adoption_requests FOR EACH ROW EXECUTE FUNCTION public.request_open_conv();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;