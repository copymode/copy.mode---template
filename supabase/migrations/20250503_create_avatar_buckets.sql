-- Criar buckets para armazenar avatares de agentes e experts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('expert-avatars', 'expert-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso público para os buckets
-- Política para leitura pública de agent-avatars
BEGIN;
  SELECT storage.create_policy(
    'agent-avatars', 
    'public-read', 
    'READ',
    'authenticated',
    true
  );
COMMIT;

-- Política para leitura pública de expert-avatars
BEGIN;
  SELECT storage.create_policy(
    'expert-avatars', 
    'public-read', 
    'READ',
    'authenticated',
    true
  );
COMMIT;

-- Política para permitir que usuários autenticados façam upload
BEGIN;
  SELECT storage.create_policy(
    'agent-avatars', 
    'authenticated-upload', 
    'INSERT',
    'authenticated',
    true
  );
COMMIT;

BEGIN;
  SELECT storage.create_policy(
    'expert-avatars', 
    'authenticated-upload', 
    'INSERT',
    'authenticated',
    true
  );
COMMIT; 