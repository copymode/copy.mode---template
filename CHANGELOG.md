# Changelog

## v1.46.0 (16 de maio de 2024)

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