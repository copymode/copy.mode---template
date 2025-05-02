-- FIX PARA POLÍTICAS RLS NO STORAGE DO SUPABASE
-- Este script resolve o erro: "new row violates row-level security policy"

-- Habilitar RLS para buckets de storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Permitir acesso público a avatares de agentes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir acesso público a avatares de experts" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de avatares de agentes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de avatares de experts" ON storage.objects;

-- Criar políticas para leitura pública de avatares
CREATE POLICY "Permitir acesso público a avatares de agentes"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Permitir acesso público a avatares de experts"
ON storage.objects FOR SELECT
USING (bucket_id = 'expert-avatars');

-- Criar políticas para permitir uploads por usuários autenticados
CREATE POLICY "Permitir upload de avatares de agentes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-avatars');

CREATE POLICY "Permitir upload de avatares de experts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expert-avatars');

-- Criar políticas para permitir atualizações e exclusões por usuários autenticados (seus próprios arquivos)
CREATE POLICY "Permitir atualização de avatares de agentes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-avatars' AND auth.uid() = owner);

CREATE POLICY "Permitir atualização de avatares de experts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'expert-avatars' AND auth.uid() = owner);

CREATE POLICY "Permitir exclusão de avatares de agentes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agent-avatars' AND auth.uid() = owner);

CREATE POLICY "Permitir exclusão de avatares de experts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'expert-avatars' AND auth.uid() = owner);

-- Configurar políticas de acesso para os buckets
CREATE POLICY "Permitir acesso a buckets de avatares" 
ON storage.buckets FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Permitir inserção em buckets de avatares"
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (name = 'agent-avatars' OR name = 'expert-avatars'); 