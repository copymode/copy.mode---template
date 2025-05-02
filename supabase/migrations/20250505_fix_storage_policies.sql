-- Verificar se os buckets existem e criar se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'agent-avatars') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('agent-avatars', 'agent-avatars', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'expert-avatars') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('expert-avatars', 'expert-avatars', true);
    END IF;
END $$;

-- Remover políticas antigas para evitar conflitos
DO $$ 
BEGIN 
    -- Remover políticas antigas dos buckets
    DELETE FROM storage.policies 
    WHERE bucket_id = 'agent-avatars' OR bucket_id = 'expert-avatars';
END $$;

-- Criar políticas abrangentes para autenticação e acesso público
-- Política para permitir leitura pública dos avatares de agentes
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Agents Public Read', 'true', 'agent-avatars');

-- Política para permitir leitura pública dos avatares de experts
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Experts Public Read', 'true', 'expert-avatars');

-- Política para permitir upload por usuários autenticados - Agentes
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Agents Auth Upload', '(auth.role() = ''authenticated'')', 'agent-avatars');

-- Política para permitir upload por usuários autenticados - Experts
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES ('Avatar Experts Auth Upload', '(auth.role() = ''authenticated'')', 'expert-avatars');

-- Adicionar coluna avatar à tabela experts se não existir
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