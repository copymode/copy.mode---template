-- Criar bucket para avatares de usuários
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar CORS para o bucket de avatares
UPDATE storage.buckets 
SET cors_origins = array['*']
WHERE id = 'avatars';

-- Criar políticas para o bucket de avatares
-- Política para leitura pública
CREATE POLICY "User avatars are publicly accessible" 
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Authenticated users can upload their own avatar" 
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir atualização pelos próprios usuários
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir exclusão pelos próprios usuários
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
); 