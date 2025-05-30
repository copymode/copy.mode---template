-- Script para criar banco de dados para novo cliente
-- Substitua {CLIENT_NAME} pelo nome do cliente

-- 1. TABELAS DE USUÁRIOS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  api_key VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABELA DE AGENTES
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  prompt TEXT NOT NULL,
  description TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  knowledges_files JSONB DEFAULT '[]'::jsonb
);

-- 3. TABELA DE EXPERTS
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  niche VARCHAR(255) NOT NULL,
  target_audience TEXT NOT NULL,
  deliverables TEXT NOT NULL,
  benefits TEXT NOT NULL,
  objections TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 4. TABELA DE TIPOS DE CONTEÚDO
CREATE TABLE content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 5. TABELA DE CHATS
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  expert_id UUID REFERENCES experts(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  content_type VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABELA DE MENSAGENS
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('agent.files', 'agent.files', false),
  ('content.type.avatars', 'content.type.avatars', true);

-- 8. POLÍTICAS RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view all agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Users can manage own experts" ON experts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own content types" ON content_types FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chats" ON chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view messages from own chats" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
);

-- 9. FUNÇÕES RPC
CREATE OR REPLACE FUNCTION is_owner_of_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = profile_id AND id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_api_key(new_api_key TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET api_key = new_api_key, updated_at = NOW() WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_name(new_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET name = new_name, updated_at = NOW() WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. DADOS INICIAIS
INSERT INTO content_types (id, name, description, user_id) VALUES
  (gen_random_uuid(), 'Post Feed', 'Conteúdo para o feed principal', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  (gen_random_uuid(), 'Story', 'Conteúdo para stories', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  (gen_random_uuid(), 'Reels', 'Conteúdo para reels/vídeos curtos', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  (gen_random_uuid(), 'Anúncio', 'Conteúdo para anúncios pagos', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
  (gen_random_uuid(), 'Carrossel', 'Conteúdo para carrosséis interativos', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- 11. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON experts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_types_updated_at BEFORE UPDATE ON content_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 