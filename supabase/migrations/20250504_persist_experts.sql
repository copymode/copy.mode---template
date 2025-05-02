-- Verifica se a tabela experts já existe, se não, cria
CREATE TABLE IF NOT EXISTS public.experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    benefits TEXT NOT NULL,
    objections TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adiciona o campo 'avatar' se não existir
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

-- Cria índice para melhorar performance de consultas por user_id
CREATE INDEX IF NOT EXISTS idx_experts_user_id ON public.experts(user_id);

-- Configuração de RLS (Row Level Security)
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança:
-- 1. Usuários autenticados podem ver seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem ver seus próprios experts"
    ON public.experts FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Usuários autenticados podem inserir seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem inserir seus próprios experts"
    ON public.experts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Usuários autenticados podem atualizar seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus próprios experts"
    ON public.experts FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Usuários autenticados podem excluir seus próprios experts
CREATE POLICY IF NOT EXISTS "Usuários podem excluir seus próprios experts"
    ON public.experts FOR DELETE
    USING (auth.uid() = user_id); 