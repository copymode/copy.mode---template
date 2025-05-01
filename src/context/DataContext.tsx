
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Agent, Expert, Chat, Message, CopyRequest } from "@/types";
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
  createExpert: (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => void;
  updateExpert: (id: string, expert: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => void;
  deleteExpert: (id: string) => void;
  
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (copyRequest: CopyRequest) => Chat;
  addMessageToChat: (chatId: string, content: string, role: "user" | "assistant") => void;
  deleteChat: (id: string) => void;
  
  // Copy Generation
  generateCopy: (request: CopyRequest) => Promise<string>;
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
    avatar: "/placeholder.svg",
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
    userId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [experts, setExperts] = useState<Expert[]>(mockExperts);
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  // Filter data based on user role
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === "user") {
      setExperts(prevExperts => 
        prevExperts.filter(expert => expert.userId === currentUser.id)
      );
      
      setChats(prevChats => 
        prevChats.filter(chat => chat.userId === currentUser.id)
      );
    }
  }, [currentUser]);

  // Agents CRUD
  const createAgent = (agent: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    const newAgent: Agent = {
      ...agent,
      id: `agent-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.id
    };
    
    setAgents(prevAgents => [...prevAgents, newAgent]);
  };
  
  const updateAgent = (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id
          ? { ...agent, ...agentData, updatedAt: new Date() }
          : agent
      )
    );
  };
  
  const deleteAgent = (id: string) => {
    if (!currentUser || currentUser.role !== "admin") return;
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));
  };

  // Experts CRUD
  const createExpert = (expert: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!currentUser) return;
    
    const newExpert: Expert = {
      ...expert,
      id: `expert-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: currentUser.id
    };
    
    setExperts(prevExperts => [...prevExperts, newExpert]);
  };
  
  const updateExpert = (id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => {
    if (!currentUser) return;
    
    setExperts(prevExperts =>
      prevExperts.map(expert =>
        expert.id === id && expert.userId === currentUser.id
          ? { ...expert, ...expertData, updatedAt: new Date() }
          : expert
      )
    );
  };
  
  const deleteExpert = (id: string) => {
    if (!currentUser) return;
    setExperts(prevExperts => 
      prevExperts.filter(expert => !(expert.id === id && expert.userId === currentUser.id))
    );
  };

  // Chats CRUD
  const createChat = (copyRequest: CopyRequest) => {
    if (!currentUser) throw new Error("Usuário não autenticado");
    
    const newChat: Chat = {
      id: `chat-${uuidv4()}`,
      title: `Nova conversa - ${new Date().toLocaleString('pt-BR')}`,
      messages: [],
      expertId: copyRequest.expertId,
      agentId: copyRequest.agentId,
      userId: currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChat(newChat);
    
    return newChat;
  };
  
  const addMessageToChat = (chatId: string, content: string, role: "user" | "assistant") => {
    if (!currentUser) return;
    
    const newMessage: Message = {
      id: `msg-${uuidv4()}`,
      content,
      role,
      chatId,
      createdAt: new Date()
    };
    
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId && chat.userId === currentUser.id
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              updatedAt: new Date()
            }
          : chat
      )
    );
    
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => 
        prev ? { ...prev, messages: [...prev.messages, newMessage], updatedAt: new Date() } : null
      );
    }
  };
  
  const deleteChat = (id: string) => {
    if (!currentUser) return;
    
    setChats(prevChats => 
      prevChats.filter(chat => !(chat.id === id && chat.userId === currentUser.id))
    );
    
    if (currentChat?.id === id) {
      setCurrentChat(null);
    }
  };

  // Copy Generation
  const generateCopy = async (request: CopyRequest): Promise<string> => {
    if (!currentUser?.apiKey) {
      throw new Error("API key não encontrada. Por favor, adicione sua chave da Groq nas configurações.");
    }
    
    const agent = agents.find(a => a.id === request.agentId);
    if (!agent) {
      throw new Error("Agente não encontrado");
    }
    
    let expertInfo = "";
    if (request.expertId) {
      const expert = experts.find(e => e.id === request.expertId);
      if (expert) {
        expertInfo = `
          Informações do Expert:
          Nicho: ${expert.niche}
          Público-alvo: ${expert.targetAudience}
          Entregáveis: ${expert.deliverables}
          Benefícios: ${expert.benefits}
          Objeções: ${expert.objections}
        `;
      }
    }
    
    // Mock API call to Groq with 2-second delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`Aqui está sua copy para ${request.contentType}:\n\n🚀 COPY GERADA PELO AI EXPERT\n\nEstá buscando transformar sua presença digital? Nosso método exclusivo já ajudou centenas de empreendedores a conquistarem resultados concretos! 📈\n\nClique no link da bio para saber mais! #MarketingDigital #Resultados`);
      }, 2000);
    });
  };

  return (
    <DataContext.Provider
      value={{
        // Agents
        agents,
        createAgent,
        updateAgent,
        deleteAgent,
        
        // Experts
        experts,
        createExpert,
        updateExpert,
        deleteExpert,
        
        // Chats
        chats,
        currentChat,
        setCurrentChat,
        createChat,
        addMessageToChat,
        deleteChat,
        
        // Copy Generation
        generateCopy
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
