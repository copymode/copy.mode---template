-- SCRIPT DE DIAGNÓSTICO PARA AVATARES NO SUPABASE

-- 1. Verificar buckets existentes
SELECT id, name, public, owner, created_at FROM storage.buckets
WHERE id IN ('agent-avatars', 'expert-avatars');

-- 2. Verificar se existem arquivos nos buckets
SELECT name, id, bucket_id, owner, created_at, updated_at, metadata
FROM storage.objects
WHERE bucket_id IN ('agent-avatars', 'expert-avatars')
LIMIT 10;

-- 3. CORRIGIR: Criar buckets se não existirem
INSERT INTO storage.buckets (id, name, public, owner)
VALUES ('agent-avatars', 'agent-avatars', true, NULL)
ON CONFLICT (id) DO 
    UPDATE SET public = true;
    
INSERT INTO storage.buckets (id, name, public, owner)
VALUES ('expert-avatars', 'expert-avatars', true, NULL)
ON CONFLICT (id) DO 
    UPDATE SET public = true;

-- 4. Verificar se a coluna avatar existe na tabela experts
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'experts'
AND column_name = 'avatar';

-- 5. Adicionar coluna avatar se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'experts' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.experts ADD COLUMN avatar TEXT;
    END IF;
END $$; 