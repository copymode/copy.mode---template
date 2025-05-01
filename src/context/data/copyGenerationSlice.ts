
import { useCallback } from "react";
import { CopyRequest } from "./types";
import { User } from "@/types";

interface GenerationDependencies {
  currentUser: User | null;
  agents: any[];
  experts: any[];
  currentChat: any | null;
}

export const useCopyGeneration = ({ currentUser, agents, experts, currentChat }: GenerationDependencies) => {
  const generateCopy = useCallback(async (request: CopyRequest): Promise<string> => {
    console.log("Generating copy with request:", request);
    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }
    if (!currentUser.apiKey) {
      throw new Error("Chave API Groq não configurada. Vá para Configurações.");
    }

    const { expertId, agentId, contentType, additionalInfo } = request;

    // --- 1. Find Agent, Expert, and Current Chat History --- 
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agente com ID ${agentId} não encontrado.`);
    }
    // Find the expert using the ID from the request. Ensure experts state is used.
    const expert = expertId ? experts.find(e => e.id === expertId && e.userId === currentUser.id) : null;
    // If user is admin, they might be able to use any expert? For now, enforce user ID match.

    // Find the relevant chat history. 
    const historyChat = currentChat; 
    
    // Filter out potential error messages we added manually & format for API
    const conversationHistory = historyChat?.messages
       .filter(msg => !msg.content.startsWith("⚠️")) 
       .map(msg => ({ role: msg.role, content: msg.content })) 
       || [];

    // If no currentChat, it implies this is the *first* message triggered from the initial form.
    // In this case, history is empty, which is correct.
    // Check for mismatch *after* calculating history
    if (!historyChat && conversationHistory.length > 0) { 
        console.warn("generateCopy: Mismatch between currentChat and existing history. History might be inaccurate.");
    }

    // --- 2. Construct System Prompt --- 
    let systemPrompt = agent.prompt; // Start with the agent's base prompt

    // Append Expert context if an expert was found and selected
    if (expert) {
      console.log("Appending context for expert:", expert.name);
      systemPrompt += `\n\nContexto Adicional (Sobre o Negócio/Produto do Usuário - Expert: ${expert.name}):
Use estas informações como base para dar mais relevância e especificidade à copy, mas priorize sempre a solicitação específica feita pelo usuário no prompt atual.\n`;
      systemPrompt += `- Nicho Principal: ${expert.niche || "Não definido"}\n`;
      systemPrompt += `- Público-alvo: ${expert.targetAudience || "Não definido"}\n`;
      systemPrompt += `- Principais Entregáveis/Produtos/Serviços: ${expert.deliverables || "Não definido"}\n`;
      systemPrompt += `- Maiores Benefícios: ${expert.benefits || "Não definido"}\n`;
      systemPrompt += `- Objeções/Dúvidas Comuns: ${expert.objections || "Não definido"}\n`;
    } else if (expertId) {
        console.warn(`Expert com ID ${expertId} foi selecionado, mas não encontrado nos dados do usuário.`);
        // Optionally inform the LLM that an expert was intended but context is missing
        systemPrompt += `\n\nNota: Um perfil de Expert foi selecionado, mas seus detalhes não estão disponíveis no momento.`;
    }
    
    // Add general instructions
    systemPrompt += `\n\nInstruções Gerais: Gere o conteúdo exclusivamente no idioma Português do Brasil. Seja criativo e siga o tom de voz implícito no prompt do agente e no contexto do expert (se fornecido). Adapte o formato ao Tipo de Conteúdo solicitado: ${contentType}.`;

    // --- 3. Prepare API Request Body --- 
    const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    const GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"; 

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory, // Past messages (user and assistant)
        // Add the current user request as the latest user message
        { role: "user", content: additionalInfo } 
      ],
      temperature: 0.7, // Keep reasonable temperature
    };

    // Debug log: Show the final messages being sent
    console.log("Sending messages to Groq:", JSON.stringify(requestBody.messages, null, 2)); 

    // --- 4. Make API Call --- 
    try {
      const response = await fetch(GROQ_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Erro desconhecido ao ler corpo do erro" }));
        console.error("Groq API Error Response:", errorBody);
        throw new Error(`Erro na API Groq: ${response.status} ${response.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
      }

      const data = await response.json();
      console.log("Groq API Success Response:", data);

      const generatedContent = data.choices?.[0]?.message?.content;

      if (!generatedContent) {
        throw new Error("Resposta da API Groq não continha conteúdo gerado.");
      }

      return generatedContent.trim();

    } catch (error) {
      console.error("Erro ao chamar a API Groq:", error);
      // Improved error re-throwing for better feedback
      let errorMessage = "Ocorreu um erro desconhecido ao chamar a API Groq.";
      if (error instanceof Error) {
         if (error.message.includes("401")) { 
             errorMessage = "Chave API Groq inválida ou expirada. Verifique as Configurações.";
         } else if (error.message.includes("Failed to fetch")) {
             errorMessage = "Não foi possível conectar à API Groq. Verifique sua conexão com a internet.";
         } else {
             errorMessage = `Falha na comunicação com a Groq: ${error.message}`;
         }
      } 
      throw new Error(errorMessage);
    }
  }, [currentUser, agents, experts, currentChat]);
  
  return { generateCopy };
};
