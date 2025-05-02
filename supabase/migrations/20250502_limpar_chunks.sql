-- Criar função para limpar a tabela agent_knowledge_chunks
CREATE OR REPLACE FUNCTION limpar_chunks()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_knowledge_chunks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 