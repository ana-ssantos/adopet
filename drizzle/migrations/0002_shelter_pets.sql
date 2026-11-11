CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelter_user_id uuid NOT NULL DEFAULT auth.uid(),
  shelter_name text NOT NULL DEFAULT '',
  shelter_city text NOT NULL DEFAULT '',
  shelter_phone text NOT NULL DEFAULT '',
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  species text NOT NULL CHECK (species IN ('cao','gato')),
  breed text NOT NULL DEFAULT '' CHECK (char_length(breed) <= 80),
  age_years numeric NOT NULL DEFAULT 1 CHECK (age_years >= 0 AND age_years <= 30),
  size text NOT NULL CHECK (size IN ('pequeno','medio','grande')),
  coat text NOT NULL CHECK (coat IN ('curto','medio','longo')),
  sex text NOT NULL CHECK (sex IN ('macho','femea')),
  vaccinated boolean NOT NULL DEFAULT false,
  dewormed boolean NOT NULL DEFAULT false,
  neutered boolean NOT NULL DEFAULT false,
  personality text NOT NULL DEFAULT '' CHECK (char_length(personality) <= 600),
  photo_url text,
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','em_processo')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets read" ON public.pets FOR SELECT TO authenticated USING (true);
CREATE POLICY "pets insert own" ON public.pets FOR INSERT TO authenticated WITH CHECK (auth.uid() = shelter_user_id);
CREATE POLICY "pets update own" ON public.pets FOR UPDATE TO authenticated USING (auth.uid() = shelter_user_id) WITH CHECK (auth.uid() = shelter_user_id);
CREATE POLICY "pets delete own" ON public.pets FOR DELETE TO authenticated USING (auth.uid() = shelter_user_id);

-- Request always points to the real owner of a registered pet
CREATE OR REPLACE FUNCTION public.set_request_shelter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  SELECT shelter_user_id INTO owner FROM public.pets WHERE id::text = NEW.pet_id;
  IF owner IS NOT NULL THEN NEW.shelter_id := owner::text; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER adoption_requests_set_shelter BEFORE INSERT ON public.adoption_requests FOR EACH ROW EXECUTE FUNCTION public.set_request_shelter();

-- Approval puts the pet "em processo de adoção"
CREATE OR REPLACE FUNCTION public.on_request_approved() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'aprovada' AND OLD.status IS DISTINCT FROM 'aprovada' THEN
    UPDATE public.pets SET status = 'em_processo' WHERE id::text = NEW.pet_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER adoption_requests_approved AFTER UPDATE OF status ON public.adoption_requests FOR EACH ROW EXECUTE FUNCTION public.on_request_approved();

GRANT UPDATE (status) ON public.adoption_requests TO authenticated;
CREATE POLICY "shelter reads received" ON public.adoption_requests FOR SELECT TO authenticated USING (shelter_id = auth.uid()::text);
CREATE POLICY "shelter decides received" ON public.adoption_requests FOR UPDATE TO authenticated USING (shelter_id = auth.uid()::text) WITH CHECK (shelter_id = auth.uid()::text AND status IN ('aprovada','recusada'));