# Changelog

## v1.46.1 (2023-11-03)

### Correções de Bugs
- Corrigido o problema de exclusão de agentes e experts com chats associados
- Implementada exclusão em cascata para remover chats associados antes de excluir agentes/experts
- Adicionado tratamento robusto para a exclusão de arquivos de conhecimento e avatares
- Corrigido bug que permitia exclusão direta sem confirmação do usuário

### Segurança
- Melhorada a proteção contra violações de chave estrangeira ao excluir entidades relacionadas
- Implementado tratamento adequado de erros durante o processo de exclusão

### Melhorias
- Fluxo de exclusão mais robusto com tratamento de erros aprimorado
- Manutenção do estado local após operações de exclusão em cascata

## v1.46.0 (2023-10-30)
- Versão estável anterior à correção de bugs

### 🐛 Correções de Bugs

- Corrigido problema onde as mensagens desapareciam após fazer scroll na interface de chat
- Corrigido problema de mensagens duplicadas ao enviar uma nova mensagem no chat
- Corrigido problema de sincronização onde as mensagens não apareciam no sidebar após serem enviadas

### 🧠 Melhorias Técnicas

- Refatorada a lógica de atualização de estado no ChatArea para melhorar desempenho
- Melhorada a gestão de estado nas funções de chat para evitar inconsistências
- Adicionado parâmetro de controle para atualização de estado na função addMessageToChat

### ♻️ Otimizações

- Otimizado o fluxo de dados entre os componentes e o contexto global
- Removidos tempos de espera desnecessários que causavam problemas na UI 