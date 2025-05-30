-- Primeiro, removemos a constraint existente
ALTER TABLE chats
DROP CONSTRAINT IF EXISTS chats_agent_id_fkey;

-- Depois, adicionamos a nova constraint com ON DELETE CASCADE
ALTER TABLE chats
ADD CONSTRAINT chats_agent_id_fkey
FOREIGN KEY (agent_id)
REFERENCES agents(id)
ON DELETE CASCADE; 