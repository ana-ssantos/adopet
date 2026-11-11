CREATE TABLE public.adoption_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pet_id text NOT NULL,
  shelter_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  housing text NOT NULL CHECK (housing IN ('casa','apartamento','outro')),
  has_other_pets boolean NOT NULL DEFAULT false,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pet_id)
);
GRANT SELECT, INSERT ON public.adoption_requests TO authenticated;
GRANT ALL ON public.adoption_requests TO service_role;
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests read" ON public.adoption_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own requests insert" ON public.adoption_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pendente');