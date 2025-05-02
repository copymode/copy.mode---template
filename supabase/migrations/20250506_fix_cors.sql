-- Configurar CORS para permitir acesso ao storage do Supabase
-- Adicionando as origens necessárias

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('temp', 'temp', true, null, null)
ON CONFLICT (id) DO NOTHING;

-- A função abaixo altera a configuração CORS do bucket especificado
-- para permitir acesso de qualquer origem
CREATE OR REPLACE FUNCTION enable_storage_cors() RETURNS VOID AS $$
BEGIN
    -- Atualizar configuração CORS para o bucket agent-avatars
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'agent-avatars';
    
    -- Atualizar configuração CORS para o bucket expert-avatars
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'expert-avatars';
    
    -- Atualizar configuração CORS para o bucket agent.files
    UPDATE storage.buckets 
    SET cors_origins = array['*']
    WHERE id = 'agent.files';
    
    RAISE NOTICE 'CORS configurado para permitir acesso de qualquer origem.';
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT enable_storage_cors();

-- Removendo bucket temporário
DELETE FROM storage.buckets WHERE id = 'temp'; 