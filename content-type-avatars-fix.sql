-- Script para corrigir políticas de RLS para o bucket content.type.avatars

-- Verificar se o bucket existe e criar se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'content.type.avatars') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('content.type.avatars', 'content.type.avatars', true);
    END IF;
END $$;

-- Verificar CORS para o bucket de avatares de tipos de conteúdo
UPDATE storage.buckets 
SET cors_origins = array['*']
WHERE id = 'content.type.avatars';

-- Limpar políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Avatar images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload content type avatars" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update content type avatars" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete content type avatars" ON storage.objects;

-- Criar políticas mais permissivas para debug
-- Política para permitir leitura pública dos avatares
CREATE POLICY "Content Type Avatars - Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'content.type.avatars');

-- Política para permitir upload por qualquer usuário autenticado (temporariamente)
CREATE POLICY "Content Type Avatars - Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir atualização por qualquer usuário autenticado (temporariamente)
CREATE POLICY "Content Type Avatars - Auth Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
);

-- Política para permitir exclusão por qualquer usuário autenticado (temporariamente)
CREATE POLICY "Content Type Avatars - Auth Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content.type.avatars' AND
  auth.role() = 'authenticated'
);

-- Verificar permissões após aplicação
SELECT name, operation, definition
FROM storage.policies
WHERE bucket_id = 'content.type.avatars'; 