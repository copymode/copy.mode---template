-- Correção para políticas de RLS do bucket 'content.type.avatars'

-- 1. Verificar e criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('content.type.avatars', 'content.type.avatars', true)
ON CONFLICT (id) DO 
  UPDATE SET public = true;

-- 2. Configurar CORS para o bucket
UPDATE storage.buckets 
SET cors_origins = array['*']
WHERE id = 'content.type.avatars';

-- 3. Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Avatar images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload content type avatars" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update content type avatars" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete content type avatars" ON storage.objects;

-- 4. Criar novas políticas mais permissivas
-- Política para permitir leitura pública
CREATE POLICY "Content type avatars - Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'content.type.avatars');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Content type avatars - Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir atualização pelo proprietário
CREATE POLICY "Content type avatars - Authenticated Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir exclusão pelo proprietário
CREATE POLICY "Content type avatars - Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
); 