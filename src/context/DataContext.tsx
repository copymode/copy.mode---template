import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Agent, Expert, Chat, Message, CopyRequest, User } from "@/types";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";

interface DataContextType {
  // Agents
  agents: Agent[];
  createAgent: (agent: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => void;
  updateAgent: (id: string, agent: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => void;
  deleteAgent: (id: string) => void;
  
  // Experts
  experts: Expert[];
  addExpert: (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => void;
  updateExpert: (id: string, expert: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => void;
  deleteExpert: (id: string) => void;
  
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (copyRequest: CopyRequest) => Chat;
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant") => void;
  deleteChat: (id: string) => void;
  deleteMessageFromChat: (chatId: string, messageId: string) => void;
  
  // Copy Generation
  generateCopy: (request: CopyRequest) => Promise<string>;

  // Loading State
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Copywriter Expert",
    avatar: "/placeholder.svg",
    prompt: "Você é um especialista em copywriting para redes sociais.",
    description: "Este agente cria copies persuasivas para redes sociais.",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin-1"
  },
  {
    id: "agent-2",
    name: "Instagram Specialist",
    avatar: "/placeholder.svg",
    prompt: "Você é um especialista em conteúdo para Instagram.",
    description: "Este agente é especializado em criar conteúdo otimizado para Instagram.",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin-1"
  }
];

const mockExperts: Expert[] = [
  {
    id: "expert-1",
    name: "Marketing Digital",
    niche: "Marketing Digital",
    targetAudience: "Empreendedores que querem aumentar sua presença online",
    deliverables: "Estratégias de marketing, otimização de SEO",
    benefits: "Aumento de tráfego, mais conversões",
    objections: "Tempo, custo inicial",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-1"
  }
];

const mockChats: Chat[] = [
  {
    id: "chat-1",
    title: "Copy para Instagram",
    messages: [
      {
        id: "msg-1",
        content: "Preciso de uma copy para post no Instagram sobre marketing digital",
        role: "user",
        chatId: "chat-1",
        createdAt: new Date()
      },
      {
        id: "msg-2",
        content: "Aqui está uma sugestão de copy para seu post...",
        role: "assistant",
        chatId: "chat-1",
        createdAt: new Date()
      }
    ],
    expertId: "expert-1",
    agentId: "agent-1",
    contentType: "Post Feed",
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]); // Initialize as empty
  const [experts, setExperts] = useState<Expert[]>([]); // Initialize as empty
  const [chats, setChats] = useState<Chat[]>([]); // Initialize as empty
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedAgents = localStorage.getItem("agents_data");
      const storedExperts = localStorage.getItem("experts_data");
      const storedChats = localStorage.getItem("chats_data");
      const storedCurrentChatId = localStorage.getItem("currentChatId_data");

      const loadedAgents = storedAgents ? JSON.parse(storedAgents) : mockAgents; // Fallback to mock
      const loadedExperts = storedExperts ? JSON.parse(storedExperts) : mockExperts; // Fallback to mock
      const loadedChats = storedChats ? JSON.parse(storedChats, (key, value) => {
         // Revive dates from ISO strings
         if (key === 'createdAt' || key === 'updatedAt') {
           return new Date(value);
         }
         return value;
       }) : mockChats; // Fallback to mock

      setAgents(loadedAgents);
      setExperts(loadedExperts);
      setChats(loadedChats);
      
      if (storedCurrentChatId && storedCurrentChatId !== 'null') {
        const foundChat = loadedChats.find((chat: Chat) => chat.id === storedCurrentChatId);
        setCurrentChat(foundChat || null);
      } else {
         setCurrentChat(null);
      }

    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Fallback to mocks if parsing fails
      setAgents(mockAgents);
      setExperts(mockExperts);
      setChats(mockChats);
      setCurrentChat(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this runs only once on mount

   // Save data to localStorage whenever it changes
   useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
       localStorage.setItem("agents_data", JSON.stringify(agents));
    } catch (error) {
       console.error("Error saving agents to localStorage:", error);
    }
   }, [agents, isLoading]);

   useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
       localStorage.setItem("experts_data", JSON.stringify(experts));
    } catch (error) {
       console.error("Error saving experts to localStorage:", error);
    }
   }, [experts, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
      localStorage.setItem("chats_data", JSON.stringify(chats));
    } catch (error) {
      console.error("Error saving chats to localStorage:", error);
    }
  }, [chats, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    try {
       localStorage.setItem("currentChatId_data", currentChat ? currentChat.id : "null");
    } catch (error) {
       console.error("Error saving currentChatId to localStorage:", error);
    }
  }, [currentChat, isLoading]);


  // Filter data based on user role and handle loading state
  useEffect(() => {
    if (isLoading || !currentUser) return; // Wait for loading and user

    // Load data again or filter existing loaded data
    const storedExperts = localStorage.getItem("experts_data");
    const loadedExperts = storedExperts ? JSON.parse(storedExperts) : mockExperts;
    const storedChats = localStorage.getItem("chats_data");
     const loadedChats = storedChats ? JSON.parse(storedChats, (key, value) => {
         if (key === 'createdAt' || key === 'updatedAt') return new Date(value);
         return value;
       }) : mockChats;

    if (currentUser.role === "user") {
       setExperts(loadedExperts.filter((expert: Expert) => expert.userId === currentUser.id));
       setChats(loadedChats.filter((chat: Chat) => chat.userId === currentUser.id));
    } else {
      // Admin sees all data (already loaded or from mocks)
      setExperts(loadedExperts);
      setChats(loadedChats);
    }
    // Reset currentChat if it doesn't belong to the current user or doesn't exist anymore
    if (currentChat && 
        ((currentUser.role !== 'admin' && currentChat.userId !== currentUser.id) || 
         !loadedChats.some((chat: Chat) => chat.id === currentChat.id))) {
      setCurrentChat(null);
    }

  }, [currentUser, isLoading, currentChat]); // Added currentChat as a dependency

  // Agents CRUD
  const createAgent = useCallback((agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    const newAgent: Agent = {
      // Ensure all fields from agentData are included
      name: agentData.name,
      description: agentData.description,
      prompt: agentData.prompt,
      temperature: agentData.temperature, // Add temperature
      avatar: agentData.avatar, // Keep avatar
      // Generate new fields
      id: `agent-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.id
    };
    
    setAgents(prevAgents => [...prevAgents, newAgent]);
  }, [currentUser]);
  
  // Ensure updateAgent accepts the full Agent type (minus generated fields)
  // and includes temperature
  const updateAgent = useCallback((id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id
          ? { 
              ...agent, // Keep existing fields like id, createdBy, createdAt
              ...agentData, // Apply updates from agentData (includes name, desc, prompt, temp, avatar)
              updatedAt: new Date() // Update the date
            }
          : agent
      )
    );
  }, [currentUser]);
  
  const deleteAgent = useCallback((id: string) => {
    if (!currentUser || currentUser.role !== "admin") return;
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));
  }, [currentUser]);

  // Experts CRUD
  const addExpert = useCallback((expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!currentUser) return;
    
    const newExpert: Expert = {
      ...expertData,
      id: `expert-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: currentUser.id
    };
    
    setExperts(prevExperts => [...prevExperts, newExpert]);
  }, [currentUser]);
  
  const updateExpert = useCallback((id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => {
    if (!currentUser) return;
    
    setExperts(prevExperts =>
      prevExperts.map(expert =>
        expert.id === id && expert.userId === currentUser.id
          ? { 
              ...expert, 
              ...expertData,
              updatedAt: new Date() 
            }
          : expert
      )
    );
  }, [currentUser]);
  
  const deleteExpert = useCallback((id: string) => {
    if (!currentUser) return;
    setExperts(prevExperts => 
      prevExperts.filter(expert => !(expert.id === id && expert.userId === currentUser.id))
    );
  }, [currentUser]);

  // Chats CRUD
  const stableSetCurrentChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  const createChat = useCallback((copyRequest: CopyRequest) => {
    if (!currentUser) throw new Error("Usuário não autenticado");
    
    const newChat: Chat = {
      id: `chat-${uuidv4()}`,
      title: `Nova conversa - ${new Date().toLocaleString('pt-BR')}`,
      messages: [],
      expertId: copyRequest.expertId,
      agentId: copyRequest.agentId,
      contentType: copyRequest.contentType,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChat(newChat);
    
    return newChat;
  }, [currentUser]);
  
  const addMessageToChat = useCallback((chatId: string, content: string, role: "user" | "assistant") => {
    if (!currentUser) return;
    
    const newMessage: Message = {
      id: `msg-${uuidv4()}`,
      content,
      role,
      chatId,
      createdAt: new Date()
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId && (currentUser.role === 'admin' || chat.userId === currentUser.id)) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );

    setCurrentChat(prev => {
      if (prev?.id === chatId) {
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          updatedAt: new Date()
        };
      } 
      return prev;
    });
  }, [currentUser]);
  
  const deleteChat = useCallback((id: string) => {
    if (!currentUser) return;
    
    setChats(prevChats => 
      prevChats.filter(chat => !(chat.id === id && (currentUser.role === 'admin' || chat.userId === currentUser.id)))
    );
    
    if (currentChat?.id === id) {
      setCurrentChat(null);
    }
  }, [currentUser, currentChat]);

  // Add function to delete a specific message
  const deleteMessageFromChat = useCallback((chatId: string, messageId: string) => {
    if (!currentUser) return;

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId && (currentUser.role === 'admin' || chat.userId === currentUser.id)) {
          return { 
            ...chat, 
            messages: chat.messages.filter(msg => msg.id !== messageId), 
            updatedAt: new Date() 
          };
        }
        return chat;
      })
    );

    setCurrentChat(prev => 
      prev?.id === chatId 
        ? { ...prev, messages: prev.messages.filter(msg => msg.id !== messageId), updatedAt: new Date() } 
        : prev
    );
  }, [currentUser]);

  // Copy Generation
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
    // Define DEFAULT_TEMPERATURE constant within the scope if not already defined globally
    const DEFAULT_TEMPERATURE = 0.7;
    // Example model, replace with actual model if needed
    const GROQ_MODEL = "llama3-8b-8192"; // Using a known model from docs

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory, // Past messages (user and assistant)
        // Add the current user request as the latest user message
        { role: "user", content: additionalInfo } 
      ],
      // Use agent's temperature or default fallback
      temperature: agent.temperature ?? DEFAULT_TEMPERATURE, 
      // Consider adding other relevant parameters like max_tokens if needed
      // max_tokens: 1024, 
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

  // --- Memoize the context value --- 
  const value = useMemo(() => ({
    isLoading, // Export isLoading state
    // Agents
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    
    // Experts
    experts,
    addExpert,
    updateExpert,
    deleteExpert,
    
    // Chats
    chats,
    currentChat,
    setCurrentChat: stableSetCurrentChat,
    createChat,
    addMessageToChat,
    deleteChat,
    deleteMessageFromChat,
    
    // Copy Generation
    generateCopy
  }), [
    isLoading, // Add isLoading to dependencies
    agents, experts, chats, currentChat, 
    createAgent, updateAgent, deleteAgent,
    addExpert, updateExpert, deleteExpert,
    stableSetCurrentChat, createChat, addMessageToChat, deleteChat, deleteMessageFromChat,
    generateCopy
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
