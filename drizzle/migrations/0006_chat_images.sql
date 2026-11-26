-- Anexo de imagem no chat: coluna na mensagem + bucket privado com acesso só para os dois lados da conversa.

ALTER TABLE public.messages ADD COLUMN imagem_path text;

-- Agora uma mensagem pode ter só a imagem (texto vazio), mas nunca estar totalmente vazia.
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%length(texto)%'
  LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.messages ADD CONSTRAINT messages_conteudo_check
  CHECK (length(texto) <= 2000 AND (length(texto) >= 1 OR imagem_path IS NOT NULL));
-- A imagem tem de estar na pasta da própria conversa.
ALTER TABLE public.messages ADD CONSTRAINT messages_imagem_pasta_check
  CHECK (imagem_path IS NULL OR imagem_path LIKE conversa_id::text || '/%');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- A primeira pasta do caminho é o id da conversa; CASE evita converter pastas de outros buckets.
CREATE POLICY "chat images upload members" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (CASE WHEN bucket_id = 'chat-images' THEN public.is_conv_member(((storage.foldername(name))[1])::uuid) ELSE false END);
CREATE POLICY "chat images read members" ON storage.objects FOR SELECT TO authenticated
  USING (CASE WHEN bucket_id = 'chat-images' THEN public.is_conv_member(((storage.foldername(name))[1])::uuid) ELSE false END);
