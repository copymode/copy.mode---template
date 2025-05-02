-- Verificar buckets existentes
SELECT id, name, public FROM storage.buckets;

-- Recriar o bucket com certeza
DROP BUCKET IF EXISTS content.type.avatars;
CREATE BUCKET content.type.avatars PUBLIC;

-- Recriar políticas para o bucket
BEGIN;
  -- Remover políticas existentes
  DROP POLICY IF EXISTS "Content type avatars - Public Read" ON storage.objects;
  DROP POLICY IF EXISTS "Content type avatars - Authenticated Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Content type avatars - Authenticated Update" ON storage.objects; 
  DROP POLICY IF EXISTS "Content type avatars - Authenticated Delete" ON storage.objects;

  -- Criar novas políticas
  CREATE POLICY "Content type avatars - Public Read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content.type.avatars');

  CREATE POLICY "Content type avatars - Authenticated Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content.type.avatars' AND
    auth.role() = 'authenticated'
  );

  CREATE POLICY "Content type avatars - Authenticated Update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'content.type.avatars' AND
    auth.role() = 'authenticated'
  );

  CREATE POLICY "Content type avatars - Authenticated Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'content.type.avatars' AND
    auth.role() = 'authenticated'
  );
END; 