# Integração com API da Groq

## Visão Geral

O Copy AI Expert Studio utiliza a API da Groq para processamento de linguagem natural avançado, especificamente através do modelo Llama 4 Maverick. Esta integração é fundamental para a geração de conteúdo de alta qualidade para marketing.

## Pontos de Integração

### Chave de API

- A chave da API Groq é gerenciada pelo usuário final
- Usuários inserem suas próprias chaves na página de configurações
- A chave é armazenada de forma segura no perfil do usuário no Supabase
- A aplicação verifica a presença da chave antes de qualquer chamada à API

### Fluxo de Comunicação

```
Cliente ---> DataContext ---> API Groq ---> Resposta ---> Armazenamento
```

1. Cliente faz uma solicitação de geração de copy
2. DataContext prepara o prompt combinando:
   - Informações do Expert selecionado
   - Prompt base do Agent selecionado
   - Tipo de conteúdo selecionado (ContentType)
   - Informações adicionais fornecidas pelo usuário
3. Chamada à API da Groq é feita
4. Resposta é processada e exibida com efeito de digitação
5. Conteúdo é armazenado no banco de dados Supabase

## Implementação Técnica

### Função de Geração

A função principal que trata da comunicação com a API está em `DataContext.tsx`:

```typescript
// Função para gerar copy usando a API da Groq
const generateCopy = async (request: CopyRequest): Promise<string> => {
  if (!currentUser?.apiKey) {
    throw new Error("API key não configurada");
  }
  
  // Construção do prompt
  const promptData = await buildPrompt(request);
  
  try {
    // Chamada à API da Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.apiKey}`
      },
      body: JSON.stringify({
        model: "llama4-maverick",  // Modelo fixo
        messages: promptData,
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Groq: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao gerar copy:", error);
    throw error;
  }
};
```

### Construção do Prompt

O sistema constrói um prompt estruturado para obter resultados ótimos:

```typescript
// Função para construir o prompt completo
const buildPrompt = async (request: CopyRequest): Promise<any[]> => {
  const { expertId, agentId, contentType, additionalInfo } = request;
  
  // Buscar dados necessários
  const agent = await getAgentById(agentId);
  const expert = expertId ? experts.find(e => e.id === expertId) : null;
  const content = contentTypes.find(c => c.id === contentType);
  
  // Estrutura de mensagens para a API
  const messages = [
    {
      role: "system",
      content: agent?.prompt || "Você é um copywriter especializado em marketing digital."
    }
  ];
  
  // Adicionar informações do expert se disponível
  if (expert) {
    messages.push({
      role: "system",
      content: `
        Informações sobre o negócio/produto:
        Nome: ${expert.name}
        Nicho: ${expert.niche}
        Público-alvo: ${expert.targetAudience}
        Entregáveis: ${expert.deliverables}
        Benefícios: ${expert.benefits}
        Objeções: ${expert.objections}
      `
    });
  }
  
  // Adicionar tipo de conteúdo
  if (content) {
    messages.push({
      role: "system",
      content: `Você deve criar conteúdo para ${content.name}: ${content.description || ""}`
    });
  }
  
  // Adicionar a solicitação do usuário
  messages.push({
    role: "user",
    content: additionalInfo
  });
  
  return messages;
};
```

## Considerações Técnicas

### Limites da API

- **Rate Limits**: A API da Groq possui limites de requisições por minuto que devem ser respeitados
- **Tamanho do Prompt**: Há um limite máximo para o tamanho do prompt (tokens)
- **Custo**: Cada chamada à API tem um custo associado às tokens processadas

### Tratamento de Erros

O sistema implementa tratamento de erros robusto:

1. **Verificação Prévia**: Validação da presença da chave de API
2. **Timeout**: Implementação de timeout para chamadas à API (30 segundos)
3. **Retry**: Lógica de retry para falhas temporárias (até 3 tentativas)
4. **Feedback ao Usuário**: Mensagens claras de erro exibidas via toast

### Cache

Para otimizar o uso da API:

- Chats e respostas são armazenados localmente
- Interações subsequentes em um mesmo chat usam o histórico armazenado
- O sistema atualiza apenas o necessário em interações contínuas

## Segurança

### Proteção da Chave API

- Chave é armazenada na tabela de usuários do Supabase
- Políticas RLS garantem que apenas o próprio usuário pode acessar sua chave
- A chave nunca é exposta no frontend além do momento da configuração

### Sanitização

- Todo o conteúdo de entrada é sanitizado antes de ser enviado à API
- Conteúdo de saída é verificado para garantir que não contenha código malicioso

## Monitoramento

O sistema implementa logs para rastrear o uso da API:

- Chamadas à API são registradas no console (em desenvolvimento)
- Erros são capturados e armazenados para análise

## Futuras Melhorias

1. **Proxy Server**: Implementar um servidor proxy para proteger ainda mais as chaves API
2. **Streaming**: Implementar resposta em streaming para melhor experiência do usuário
3. **Múltiplos Modelos**: Permitir seleção entre diferentes modelos disponíveis na Groq
4. **Fine-tuning**: Integração com modelos fine-tuned para nichos específicos
5. **Analytics**: Rastreamento de uso e métricas de performance 