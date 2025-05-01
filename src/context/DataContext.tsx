import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Agent, Expert, Chat, Message, CopyRequest, User, KnowledgeFile } from "@/types";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
// Import Supabase client
import { supabase } from "@/integrations/supabase/client";

// Define table and bucket names as constants
const AGENTS_TABLE = 'agents';
const EXPERTS_TABLE = 'experts'; // Assuming experts table name
const CHATS_TABLE = 'chats';     // Assuming chats table name
const KNOWLEDGE_BUCKET = 'agent.files';

// Define the shape of the Agent data returned from Supabase
// (assuming snake_case for column names like created_by, knowledge_files)
interface DbAgent {
  id: string;
  name: string;
  avatar?: string;
  prompt: string;
  description?: string; // Made optional to match DB
  temperature?: number;
  created_at: string; // DB returns ISO string
  updated_at: string; // DB returns ISO string
  created_by: string;
  knowledges_files?: KnowledgeFile[]; // Corrected: Use knowledges_files
}

// Adapter function to convert DB data to frontend type
function adaptAgentFromDb(dbAgent: DbAgent): Agent {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    avatar: dbAgent.avatar,
    prompt: dbAgent.prompt,
    description: dbAgent.description || '', // Handle potential null from DB
    temperature: dbAgent.temperature, // Already optional
    createdAt: new Date(dbAgent.created_at),
    updatedAt: new Date(dbAgent.updated_at),
    createdBy: dbAgent.created_by,
    // Corrected: Use knowledges_files from DB
    knowledgeFiles: dbAgent.knowledges_files || [], 
  };
}

interface DataContextType {
  agents: Agent[];
  // Modify createAgent to return the created Agent or its ID
  createAgent: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">) => Promise<Agent>; 
  updateAgent: (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => Promise<void>; 
  deleteAgent: (id: string) => Promise<void>; 
  
  // Experts (Keep mocks for now or update similarly if needed)
  experts: Expert[];
  addExpert: (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => void;
  updateExpert: (id: string, expert: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => void;
  deleteExpert: (id: string) => void;
  
  // Chats (Keep mocks for now or update similarly if needed)
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (copyRequest: CopyRequest) => Chat;
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant") => void;
  deleteChat: (id: string) => void;
  deleteMessageFromChat: (chatId: string, messageId: string) => void;
  
  // Copy Generation (Keep as is for now)
  generateCopy: (request: CopyRequest) => Promise<string>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// REMOVE MOCK DATA FOR AGENTS
/*
const mockAgents: Agent[] = [ ... ];
*/
// Keep mocks for Experts and Chats for now
const mockExperts: Expert[] = [/* ... */];
const mockChats: Chat[] = [/* ... */];


export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]); 
  const [experts, setExperts] = useState<Expert[]>(mockExperts); // Keep using mocks for now
  const [chats, setChats] = useState<Chat[]>(mockChats);       // Keep using mocks for now
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load initial data from Supabase
  useEffect(() => {
    if (!currentUser || initialLoadComplete) return; // Only load once per user session

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch Agents
        const { data: agentsData, error: agentsError } = await supabase
          .from(AGENTS_TABLE)
          .select('*'); // Fetch all columns
          // .eq('created_by', currentUser.id); // Uncomment if admins should only see their own agents initially
        
        if (agentsError) throw agentsError;
        // Adapt agents data
        setAgents(agentsData ? agentsData.map(adaptAgentFromDb) : []);

        // TODO: Fetch Experts from DB (similar pattern)
        // const { data: expertsData, error: expertsError } = await supabase.from(EXPERTS_TABLE)...;
        // setExperts(expertsData ? expertsData.map(adaptExpertFromDb) : []);
        setExperts(mockExperts); // Keep using mock for now

        // TODO: Fetch Chats from DB (similar pattern)
        // const { data: chatsData, error: chatsError } = await supabase.from(CHATS_TABLE)...;
        // setChats(chatsData ? chatsData.map(adaptChatFromDb) : []);
        setChats(mockChats); // Keep using mock for now

        setInitialLoadComplete(true); // Mark load as complete

      } catch (error) {
        console.error("Error loading initial data from Supabase:", error);
        // Handle error appropriately (e.g., show toast, fallback to empty)
        setAgents([]);
        setExperts(mockExperts); // Fallback to mocks on error for now
        setChats(mockChats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  // Rerun if currentUser changes (login/logout) 
  // Reset initialLoadComplete on user change to force reload
  }, [currentUser]);

  // Reset initialLoadComplete when user logs out
  useEffect(() => {
      if (!currentUser) {
          setInitialLoadComplete(false);
          setAgents([]); // Clear data on logout
          setExperts(mockExperts);
          setChats(mockChats);
      }
  }, [currentUser]);


  // --- Agents CRUD (Connected to Supabase) --- 

  const createAgent = useCallback(async (
    agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">
  ): Promise<Agent> => { 
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem criar agentes.");
    }
    
    const dataToInsert = {
      name: agentData.name,
      description: agentData.description,
      prompt: agentData.prompt,
      temperature: agentData.temperature,
      avatar: agentData.avatar,
      created_by: currentUser.id, 
      // knowledge_files is initially null or handled in update
    };

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      throw new Error(`Falha ao criar agente: ${error.message}`);
    }
    if (!data) {
      throw new Error("Falha ao criar agente: Nenhum dado retornado.");
    }

    const newAgent = adaptAgentFromDb(data as DbAgent);
    setAgents(prevAgents => [...prevAgents, newAgent]);
    return newAgent; 

  }, [currentUser]);
  
  const updateAgent = useCallback(async (
    id: string, 
    agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>
  ) => {
    if (!currentUser || currentUser.role !== "admin") {
       throw new Error("Apenas administradores podem atualizar agentes.");
    }

    const dataToUpdate: { [key: string]: any } = { 
        // Spread core fields (name, description, prompt, temperature, avatar)
        ...(agentData.name && { name: agentData.name }),
        ...(agentData.description !== undefined && { description: agentData.description }),
        ...(agentData.prompt && { prompt: agentData.prompt }),
        ...(agentData.temperature !== undefined && { temperature: agentData.temperature }),
        ...(agentData.avatar && { avatar: agentData.avatar }),
        // Corrected: Use knowledges_files for DB update
        ...(agentData.knowledgeFiles && { knowledges_files: agentData.knowledgeFiles }),
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .update(dataToUpdate) 
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating agent:", error);
      throw new Error(`Falha ao atualizar agente: ${error.message}`);
    }
     if (!data) {
      throw new Error("Falha ao atualizar agente: Nenhum dado retornado.");
    }

    const updatedAgent = adaptAgentFromDb(data as DbAgent);
    setAgents(prevAgents =>
      prevAgents.map(agent => (agent.id === id ? updatedAgent : agent))
    );

  }, [currentUser]);
  
  const deleteAgent = useCallback(async (id: string) => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem excluir agentes.");
    }

    try {
      // Fetch agent data including knowledges_files (Corrected column name)
      const { data: agentDataAny, error: fetchError } = await supabase
        .from(AGENTS_TABLE)
        .select('knowledges_files') // Corrected: Select knowledges_files
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { 
         console.error("Error fetching agent files before delete:", fetchError);
      }

      // Corrected property access
      const filesToDelete = (agentDataAny as any)?.knowledges_files as KnowledgeFile[] || [];
      const filePathsToDelete = filesToDelete.map(f => f.path).filter(p => !!p);

      if (filePathsToDelete.length > 0) {
        console.log(`Attempting to delete files from storage: ${filePathsToDelete.join(', ')}`);
        const { error: storageError } = await supabase.storage
          .from(KNOWLEDGE_BUCKET)
          .remove(filePathsToDelete);
        
        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
        }
      }

      const { error: deleteError } = await supabase
        .from(AGENTS_TABLE)
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));

    } catch (error: any) {
        console.error("Error deleting agent:", error);
        throw new Error(`Falha ao excluir agente: ${error.message}`);
    }
  }, [currentUser]);

  // Experts CRUD (Mocks - Keep as is or update later)
  const addExpert = useCallback((expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    // ... mock implementation ...
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
   // ... mock implementation ...
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
    // ... mock implementation ...
     if (!currentUser) return;
    setExperts(prevExperts => 
      prevExperts.filter(expert => !(expert.id === id && expert.userId === currentUser.id))
    );
  }, [currentUser]);

  // Chats CRUD (Mocks - Keep as is or update later)
  const stableSetCurrentChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
  }, []);

  const createChat = useCallback((copyRequest: CopyRequest) => {
     // ... mock implementation ...
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
    // ... mock implementation ...
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
    // ... mock implementation ...
    if (!currentUser) return;
    
    setChats(prevChats => 
      prevChats.filter(chat => !(chat.id === id && (currentUser.role === 'admin' || chat.userId === currentUser.id)))
    );
    
    if (currentChat?.id === id) {
      setCurrentChat(null);
    }
  }, [currentUser, currentChat]);

  const deleteMessageFromChat = useCallback((chatId: string, messageId: string) => {
    // ... mock implementation ...
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

  // Copy Generation (Keep as is)
  const generateCopy = useCallback(async (request: CopyRequest): Promise<string> => {
     // ... implementation using Groq ...
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
    const expert = expertId ? experts.find(e => e.id === expertId && e.userId === currentUser.id) : null;
    const historyChat = currentChat; 
    const conversationHistory = historyChat?.messages
       .filter(msg => !msg.content.startsWith("⚠️")) 
       .map(msg => ({ role: msg.role, content: msg.content })) 
       || [];
    if (!historyChat && conversationHistory.length > 0) { 
        console.warn("generateCopy: Mismatch between currentChat and existing history. History might be inaccurate.");
    }

    // --- 2. Construct System Prompt --- 
    let systemPrompt = agent.prompt;
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
        systemPrompt += `\n\nNota: Um perfil de Expert foi selecionado, mas seus detalhes não estão disponíveis no momento.`;
    }
    systemPrompt += `\n\nInstruções Gerais: Gere o conteúdo exclusivamente no idioma Português do Brasil. Seja criativo e siga o tom de voz implícito no prompt do agente e no contexto do expert (se fornecido). Adapte o formato ao Tipo de Conteúdo solicitado: ${contentType}.`;

    // --- 3. Prepare API Request Body --- 
    const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    const DEFAULT_TEMPERATURE = 0.7;
    const GROQ_MODEL = "llama3-8b-8192"; 

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory, 
        { role: "user", content: additionalInfo } 
      ],
      temperature: agent.temperature ?? DEFAULT_TEMPERATURE, 
    };
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
    isLoading, 
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    experts,
    addExpert,
    updateExpert,
    deleteExpert,
    chats,
    currentChat,
    setCurrentChat: stableSetCurrentChat,
    createChat,
    addMessageToChat,
    deleteChat,
    deleteMessageFromChat,
    generateCopy
  }), [
    isLoading, 
    agents, experts, chats, currentChat, 
    createAgent, updateAgent, deleteAgent,
    addExpert, updateExpert, deleteExpert,
    stableSetCurrentChat, createChat, addMessageToChat, deleteChat, deleteMessageFromChat,
    generateCopy
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Custom hook remains the same
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
