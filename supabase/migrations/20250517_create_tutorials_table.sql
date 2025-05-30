-- Criar tabela de tutoriais
CREATE TABLE tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  youtube_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Criar índices para otimização
CREATE INDEX idx_tutorials_order ON tutorials(order_index);
CREATE INDEX idx_tutorials_active ON tutorials(is_active);
CREATE INDEX idx_tutorials_created_by ON tutorials(created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tutorials_updated_at
  BEFORE UPDATE ON tutorials
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorials_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Política para leitura - todos os usuários autenticados podem ver tutoriais ativos
CREATE POLICY "Usuarios podem ver tutoriais ativos" ON tutorials
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política para admins - podem fazer tudo
CREATE POLICY "Admins podem gerenciar tutoriais" ON tutorials
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Função para reordenar tutoriais
CREATE OR REPLACE FUNCTION reorder_tutorials(tutorial_id UUID, new_order INTEGER)
RETURNS VOID AS $$
DECLARE
  current_order INTEGER;
  max_order INTEGER;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem reordenar tutoriais';
  END IF;

  -- Obter ordem atual
  SELECT order_index INTO current_order FROM tutorials WHERE id = tutorial_id;
  
  -- Obter ordem máxima
  SELECT COALESCE(MAX(order_index), 0) INTO max_order FROM tutorials;
  
  -- Validar nova ordem
  IF new_order < 0 THEN
    new_order := 0;
  ELSIF new_order > max_order THEN
    new_order := max_order;
  END IF;

  -- Se a ordem não mudou, não fazer nada
  IF current_order = new_order THEN
    RETURN;
  END IF;

  -- Mover outros tutoriais conforme necessário
  IF new_order > current_order THEN
    -- Movendo para baixo - decrementar ordem dos que estão entre current e new
    UPDATE tutorials 
    SET order_index = order_index - 1
    WHERE order_index > current_order AND order_index <= new_order
    AND id != tutorial_id;
  ELSE
    -- Movendo para cima - incrementar ordem dos que estão entre new e current
    UPDATE tutorials 
    SET order_index = order_index + 1
    WHERE order_index >= new_order AND order_index < current_order
    AND id != tutorial_id;
  END IF;

  -- Atualizar a ordem do tutorial principal
  UPDATE tutorials SET order_index = new_order WHERE id = tutorial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir alguns tutoriais de exemplo
INSERT INTO tutorials (title, description, youtube_url, order_index, created_by) VALUES
(
  'Como criar seu primeiro Expert',
  'Aprenda passo a passo como criar e configurar seu primeiro expert no Copy Mode. Este tutorial aborda desde a criação básica até as configurações avançadas.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  1,
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)
),
(
  'Configurando Agentes e Tipos de Conteúdo',
  'Entenda como configurar diferentes tipos de agentes e como escolher o tipo de conteúdo ideal para cada situação. Maximize a eficiência das suas campanhas.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  2,
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)
),
(
  'Gerenciando Usuários e Permissões',
  'Tutorial completo sobre como adicionar novos usuários, definir permissões e gerenciar sua equipe na plataforma Copy Mode.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  3,
  (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1)
); 