import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { Agent, Expert, Chat, Message, CopyRequest, User, KnowledgeFile, ContentType } from "@/types"; // Seus tipos centrais
import { useAuth } from "./AuthContext";
// import { v4 as uuidv4 } from "uuid"; // uuidv4 não está sendo usado
import { supabase } from "@/integrations/supabase/client";
import { OpenAI } from "openai";
import { Database } from "@/types/supabase";
import Groq from 'groq-sdk';

// --- Tipos do Supabase (gerados) ---
type DbAgentRow = Database['public']['Tables']['agents']['Row'];
type DbAgentInsert = Database['public']['Tables']['agents']['Insert'];

type DbExpertRow = Database['public']['Tables']['experts']['Row'];
type DbExpertInsert = Database['public']['Tables']['experts']['Insert'];

type DbChatRow = Database['public']['Tables']['chats']['Row'];
type DbChatInsert = Database['public']['Tables']['chats']['Insert'];

type DbMessageRow = Database['public']['Tables']['messages']['Row'];
type DbMessageInsert = Database['public']['Tables']['messages']['Insert'];

type DbContentTypeRow = Database['public']['Tables']['content_types']['Row'];
type DbContentTypeInsert = Database['public']['Tables']['content_types']['Insert'];

// --- Constantes ---
const AGENTS_TABLE = 'agents';
const EXPERTS_TABLE = 'experts';
const CHATS_TABLE = 'chats';
const MESSAGES_TABLE = 'messages';
const CONTENT_TYPES_TABLE = 'content_types';
const AGENT_KNOWLEDGE_CHUNKS_TABLE = 'agent_knowledge_chunks';

interface DataContextType {
  agents: Agent[];
  createAgent: (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">) => Promise<Agent | null>;
  updateAgent: (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">>) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<void>;
  getAgentById: (agentId: string) => Promise<Agent | null>;
  updateAgentFiles: (agentId: string, files: KnowledgeFile[]) => Promise<void>;
  refetchAgentData: (agentId: string) => Promise<void>;

  experts: Expert[];
  addExpert: (expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<Expert | null>;
  updateExpert: (id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<Expert | null>;
  deleteExpert: (id: string) => Promise<void>;

  chats: Chat[];
  setCurrentChat: (chat: Chat | null) => void;
  activeChatId: string | null;
  createChat: (copyRequest: CopyRequest) => Promise<Chat | null>;
  addMessageToChat: (chatId: string, messageData: Omit<Message, "id" | "createdAt" | "chatId">) => Promise<Message | null>;
  deleteChat: (id: string) => Promise<void>;
  deleteMessageFromChat: (chatId: string, messageId: string) => Promise<void>;

  generateCopy: (request: CopyRequest, chatHistory?: Message[]) => Promise<string>;

  contentTypes: ContentType[];
  createContentType: (contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">) => Promise<ContentType | null>;
  updateContentType: (id: string, contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>) => Promise<ContentType | null>;
  deleteContentType: (id: string) => Promise<void>;
  getContentTypeById: (id: string) => Promise<ContentType | null>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mockContentTypes: ContentType[] = [
  { id: '1', name: 'Post Feed', description: 'Conteúdo para o feed principal', avatar: undefined, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '2', name: 'Story', description: 'Conteúdo para stories', avatar: undefined, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '3', name: 'Reels', description: 'Conteúdo para reels/vídeos curtos', avatar: undefined, createdAt: new Date(), updatedAt: new Date(), userId: 'system'},
  { id: '4', name: 'Anúncio', description: 'Conteúdo para anúncios pagos', avatar: undefined, createdAt: new Date(), updatedAt: new Date(), userId: 'system'}
];

export function DataProvider({ children }: { children: ReactNode }) {
  console.log("##### EXECUTANDO src/context/DataContext.tsx REAL! #####"); // Log de Diagnóstico Único
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(mockContentTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openai = useMemo(() => {
    if (openaiApiKey) {
      return new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });
    }
    console.warn('[DataContext] VITE_OPENAI_API_KEY not found. RAG impaired.');
    return null;
  }, [openaiApiKey]);

  const mapDbAgentToAgent = useCallback((dbAgent: DbAgentRow): Agent => {
    const agentData: Agent = {
        id: dbAgent.id,
        name: dbAgent.name,
        avatar: dbAgent.avatar ?? "",
        prompt: dbAgent.prompt,
        description: dbAgent.description ?? "",
        temperature: dbAgent.temperature ?? 0.7,
        createdAt: dbAgent.created_at, 
        updatedAt: dbAgent.updated_at,
        createdBy: dbAgent.created_by ?? undefined,
        knowledgeFiles: [], // Populado em getAgentById
    };
    // Se a coluna 'model' existir na tabela 'agents' E nos tipos gerados (DbAgentRow),
    // você pode descomentar e usar a linha abaixo.
    // if ('model' in dbAgent && dbAgent.model !== null && dbAgent.model !== undefined) {
    //   agentData.model = dbAgent.model as string;
    // } else {
    //   agentData.model = "mixtral-8x7b-32768"; // Default
    // }
    // Por enquanto, confiando no tipo Agent ter model opcional e default na UI se necessário
     if (typeof (dbAgent as any).model === 'string') {
        agentData.model = (dbAgent as any).model;
    }


    return agentData;
  }, []);

  const mapDbExpertToExpert = useCallback((dbExpert: DbExpertRow): Expert => ({
    id: dbExpert.id,
    name: dbExpert.name,
    niche: dbExpert.niche,
    targetAudience: dbExpert.target_audience,
    deliverables: dbExpert.deliverables,
    benefits: dbExpert.benefits,
    objections: dbExpert.objections,
    avatar: dbExpert.avatar ?? undefined,
    userId: dbExpert.user_id,
    createdAt: new Date(dbExpert.created_at),
    updatedAt: new Date(dbExpert.updated_at),
  }), []);
  
  const mapDbContentTypeToContentType = useCallback((dbContentType: DbContentTypeRow): ContentType => ({
    id: dbContentType.id,
    name: dbContentType.name,
    avatar: dbContentType.avatar ?? undefined,
    description: dbContentType.description ?? undefined,
    userId: dbContentType.user_id,
    createdAt: new Date(dbContentType.created_at),
    updatedAt: new Date(dbContentType.updated_at),
  }), []);

  // Restaurando getContentTypeById
  const getContentTypeById = useCallback(async (id: string): Promise<ContentType | null> => {
    const localCt = contentTypes.find(ct => ct.id === id);
    if (localCt && localCt.userId !== 'system') return localCt; // Retorna mock/local se for não-sistema e já existir

    try {
        const { data, error } = await supabase.from(CONTENT_TYPES_TABLE).select<string, DbContentTypeRow>("*").eq('id', id).single();
        if (error) { 
            if (error.code === 'PGRST116') {
                 console.log(`ContentType com id ${id} não encontrado no DB.`);
                 return null;
            }
            console.error("Erro ao buscar content type por ID:", error); 
            throw error; 
        }
        if (!data) return null;
        const fetchedCt = mapDbContentTypeToContentType(data);
        // Apenas adiciona/atualiza no estado 'contentTypes' se for um tipo de conteúdo customizado (não 'system')
        if (fetchedCt.userId !== 'system') { 
             setContentTypes(prev => {
                const exists = prev.find(c => c.id === fetchedCt.id);
                if (exists) {
                    return prev.map(c => c.id === fetchedCt.id ? fetchedCt : c);
                }
                return [...prev, fetchedCt];
            });
        }
        return fetchedCt;
    } catch (error) {
        console.error("Falha ao buscar content type por ID:", error);
        return null;
    }
  }, [supabase, contentTypes, mapDbContentTypeToContentType]);

  // Restaurando getAgentById para useCallback
  const getAgentById = useCallback(async (agentId: string): Promise<Agent | null> => {
    try {
      const { data, error } = await supabase
        .from(AGENTS_TABLE)
        .select(`*`) // Seleciona todas as colunas que existem em DbAgentRow
        .eq('id', agentId)
        .single();

      if (error) { 
        if (error.code === 'PGRST116') { 
            console.log(`Agente com id ${agentId} não encontrado.`);
            return null;
        }
        console.error("Erro ao buscar agent por ID:", error); 
        throw error; 
      }
      if (!data) return null;

      const agent = mapDbAgentToAgent(data as DbAgentRow); // Cast para o tipo Row correto
      
      // Lógica para buscar knowledge files (simplificada por enquanto)
      const { data: chunks, error: chunksError } = await supabase
        .from(AGENT_KNOWLEDGE_CHUNKS_TABLE)
        .select('original_file_name, chunk_text')
        .eq('agent_id', agentId);

      if (chunksError) {
        console.error("Erro ao buscar chunks para o agente:", chunksError);
      } else if (chunks) {
        const filesMap = new Map<string, KnowledgeFile>();
        chunks.forEach(chunk => {
          if (!chunk.original_file_name) return; 
          if (!filesMap.has(chunk.original_file_name)) {
            filesMap.set(chunk.original_file_name, {
              name: chunk.original_file_name,
              path: '', 
              content: chunk.chunk_text ?? "", 
            });
          } else {
            const existingFile = filesMap.get(chunk.original_file_name)!;
            existingFile.content += `\n${chunk.chunk_text ?? ""}`;
          }
        });
        agent.knowledgeFiles = Array.from(filesMap.values());
      }
      return agent;
    } catch (error) {
      console.error("Falha ao buscar agent por ID:", error);
      return null;
    }
  }, [supabase, mapDbAgentToAgent]);

  // Corrigindo fetchUserChats de volta para useCallback async
  const fetchUserChats = useCallback(async () => {
    if (!currentUser?.id) { setChats([]); return; }
    try {
      // Usar DbChatRow que reflete a coluna 'content_type'
      const { data: chatsData, error: chatsError } = await supabase
        .from(CHATS_TABLE).select<string, DbChatRow>('*').eq('user_id', currentUser.id).order('updated_at', { ascending: false });
      
      if (chatsError) { console.error("[DataContext] Erro ao carregar chats:", chatsError); throw chatsError; }
      if (!chatsData) { setChats([]); return; }

      const chatIds = chatsData.map(c => c.id);
      let allDbMessages: DbMessageRow[] = [];
      if (chatIds.length > 0) {
        // Usar DbMessageRow. Se agent_id não existir, o tipo gerado não o terá.
        const { data: msgs, error: msgsError } = await supabase
          .from(MESSAGES_TABLE).select<string, DbMessageRow>('*').in('chat_id', chatIds).order('created_at', { ascending: true });
        if (msgsError) { console.error("[DataContext] Erro ao carregar mensagens:", msgsError); throw msgsError; }
        allDbMessages = msgs || [];
      }

      const messagesByChatId = allDbMessages.reduce((acc, dbMsg) => {
        acc[dbMsg.chat_id] = acc[dbMsg.chat_id] || [];
        let sender: Message['sender']; 
        if (dbMsg.role === 'user') {
          sender = 'user';
        } else if (dbMsg.role === 'assistant') {
          sender = 'agent';
        } else if (dbMsg.role === 'expert') {
          sender = 'expert';
        } else if (dbMsg.role === 'agent') {
          sender = 'agent';
        } else {
          console.warn(`Role não esperado '${dbMsg.role}' recebido para mensagem ${dbMsg.id}, usando 'agent' como fallback.`);
          sender = 'agent';
        }
        
        const messageEntry: Message = {
          id: dbMsg.id,
          text: dbMsg.content,
          sender: sender,
          chatId: dbMsg.chat_id,
          createdAt: new Date(dbMsg.created_at)
        };

        if ('agent_id' in dbMsg && dbMsg.agent_id !== null && dbMsg.agent_id !== undefined) {
          messageEntry.agentId = dbMsg.agent_id as string | undefined;
        }
        
        acc[dbMsg.chat_id].push(messageEntry);
        return acc;
      }, {} as Record<string, Message[]>);

      const loadedChats: Chat[] = chatsData.map((dbChat: DbChatRow) => {
        const mappedChat: Chat = {
          id: dbChat.id, 
          title: dbChat.title, 
          messages: messagesByChatId[dbChat.id] || [],
          expertId: dbChat.expert_id ?? undefined,
          agentId: dbChat.agent_id, 
          contentTypeId: dbChat.content_type ?? undefined, 
          userId: dbChat.user_id, 
          createdAt: new Date(dbChat.created_at), 
          updatedAt: new Date(dbChat.updated_at)
        };
         if (mappedChat.contentTypeId) { 
            const foundContentType = contentTypes.find(ct => ct.id === mappedChat.contentTypeId);
            if (foundContentType) {
                mappedChat.contentType = foundContentType;
            }
        }
        return mappedChat;
      });
      setChats(loadedChats);
      if (activeChatId && !loadedChats.some(c => c.id === activeChatId)) {
         setActiveChatId(null); 
      }
    } catch (error) { 
      console.error("[DataContext] Falha em fetchUserChats:", error); 
      setChats([]); 
      setActiveChatId(null); 
    }
  }, [currentUser, supabase, contentTypes, mapDbContentTypeToContentType, activeChatId]);


  useEffect(() => {
    if (currentUser && !initialLoadComplete) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        try {
          const [agentsRes, expertsRes, contentTypesRes] = await Promise.all([
            supabase.from(AGENTS_TABLE).select<string, DbAgentRow>('*').order('created_at', { ascending: false }),
            supabase.from(EXPERTS_TABLE).select<string, DbExpertRow>('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
            supabase.from(CONTENT_TYPES_TABLE).select<string, DbContentTypeRow>('*').order('name', { ascending: true })
          ]);

          if (agentsRes.error) { console.error("Erro ao buscar agents:", agentsRes.error); throw agentsRes.error; }
          setAgents(agentsRes.data?.map(mapDbAgentToAgent) || []);

          if (expertsRes.error) { console.error("Erro ao buscar experts:", expertsRes.error); throw expertsRes.error; }
          setExperts(expertsRes.data?.map(mapDbExpertToExpert) || []);
          
          if (contentTypesRes.error) {
            console.warn("Erro ao buscar ContentTypes, usando mock:", contentTypesRes.error.message);
            setContentTypes(mockContentTypes);
          } else {
            const dbContentTypes = contentTypesRes.data || [];
            if (typeof mapDbContentTypeToContentType === 'function') {
                setContentTypes(dbContentTypes.map(mapDbContentTypeToContentType));
            } else {
                console.error("mapDbContentTypeToContentType não é uma função", mapDbContentTypeToContentType)
                setContentTypes(mockContentTypes); // Fallback para mocks
            }
          }

          await fetchUserChats();
          setInitialLoadComplete(true);
        } catch (e) { 
          console.error("[DC] Erro em fetchInitialData:", e); 
          setAgents([]); setExperts([]); setChats([]); setContentTypes(mockContentTypes);
          setInitialLoadComplete(false); 
        }
        finally { setIsLoading(false); }
      };
      
      fetchInitialData();
    } else if (!currentUser) {
      setAgents([]);
      setExperts([]);
      setChats([]);
      setActiveChatId(null);
      setContentTypes(mockContentTypes); 
      setInitialLoadComplete(false); 
      setIsLoading(false);
    }
  }, [currentUser, initialLoadComplete]);


  const createAgent = useCallback(async (agentData: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">): Promise<Agent | null> => {
    if (!currentUser?.id) { console.error("Não autenticado."); return null; }
    
    const agentToInsert: DbAgentInsert = {
      name: agentData.name,
      prompt: agentData.prompt,
      created_by: currentUser.id,
      description: agentData.description ?? null,
      avatar: agentData.avatar ?? null,
      // Se 'model' existir em DbAgentInsert (verifique tipos gerados):
      // model: agentData.model ?? null, 
    };
     if (agentData.model && 'model' in agentToInsert) {
        (agentToInsert as any).model = agentData.model;
    }


    try {
      const { data, error } = await supabase
        .from(AGENTS_TABLE)
        .insert(agentToInsert)
        .select()
        .single();

      if (error) { console.error("Erro ao criar agent:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao criar agent."); return null;}

      const newAgent = mapDbAgentToAgent(data as DbAgentRow);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (error) {
      console.error("Falha ao criar agent:", error);
      return null;
    }
  }, [currentUser, supabase, mapDbAgentToAgent]);
  
  const updateAgent = useCallback(async (id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy" | "knowledgeFiles">> ): Promise<Agent | null> => {
    if (!currentUser) { console.error("Não autenticado."); return null; }

    const agentToUpdate: Partial<DbAgentInsert> = { 
        name: agentData.name,
        prompt: agentData.prompt,
        description: agentData.description,
        avatar: agentData.avatar,
        temperature: agentData.temperature,
        updated_at: new Date().toISOString(),
    };
     if (agentData.model && 'model' in agentToUpdate) {
        (agentToUpdate as any).model = agentData.model;
    }
    
    Object.keys(agentToUpdate).forEach(key => {
      const K = key as keyof typeof agentToUpdate;
      if (agentToUpdate[K] === undefined) {
        delete agentToUpdate[K];
      }
    });

    try {
      const { data, error } = await supabase
        .from(AGENTS_TABLE)
        .update(agentToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) { console.error("Erro ao atualizar agent:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao atualizar agent."); return null; }
      
      const fullAgent = await getAgentById(id); // Refetch para pegar knowledge files
      if (fullAgent) {
         setAgents(prev => prev.map(a => a.id === id ? fullAgent : a));
         return fullAgent;
      }
      // Fallback se getAgentById falhar, retorna o dado do update direto
      const updatedAgentDirectly = mapDbAgentToAgent(data as DbAgentRow);
      setAgents(prev => prev.map(a => a.id === id ? updatedAgentDirectly : a));
      return updatedAgentDirectly;

    } catch (error) {
      console.error("Falha ao atualizar agent:", error);
      return null;
    }
  }, [currentUser, supabase, mapDbAgentToAgent, getAgentById]);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    try {
      // Primeiro, deletar chats associados ao agente
      const { error: chatError } = await supabase
        .from(CHATS_TABLE)
        .delete()
        .eq('agent_id', id);

      if (chatError) {
        console.error('Erro ao deletar chats associados ao agente:', chatError);
        // Você pode decidir se quer parar aqui ou continuar tentando deletar o agente e os chunks
        // throw chatError; // Descomente para parar se a exclusão do chat falhar
      }

      // Em seguida, deletar chunks de conhecimento associados
      const { error: chunkError } = await supabase
        .from(AGENT_KNOWLEDGE_CHUNKS_TABLE)
        .delete()
        .eq('agent_id', id);

      if (chunkError) {
        console.error('Erro ao deletar chunks de conhecimento associados:', chunkError);
        // throw chunkError; // Descomente para parar se a exclusão do chunk falhar
      }

      // Finalmente, deletar o agente
      const { error: agentDeleteError } = await supabase.from(AGENTS_TABLE).delete().eq('id', id);
      if (agentDeleteError) { 
        console.error("Erro ao deletar agent:", agentDeleteError); 
        throw agentDeleteError; 
      }
      
      setAgents(prev => prev.filter(a => a.id !== id));
      // Se o agente deletado estava em algum chat aberto, você pode querer limpar esse estado também
      // Exemplo: se currentChat?.agentId === id, então setCurrentChat(null)

    } catch (error) {
      console.error("Falha na operação de deletar agent e seus dados associados:", error);
      // Opcional: notificar o usuário sobre a falha
    }
  }, [supabase]);
  
  // Declarar refetchAgentData antes de updateAgentFiles
  const refetchAgentData = useCallback(async (agentId: string) => {
    console.log(`[DataContext] Refetching agent data for ${agentId}`);
    const agent = await getAgentById(agentId); 
    if (agent) {
      setAgents(prev => prev.map(a => a.id === agentId ? agent : a));
    }
  }, [getAgentById]);

  const updateAgentFiles = useCallback(async (agentId: string, files: KnowledgeFile[]): Promise<void> => {
    console.log("[DataContext] updateAgentFiles chamada. AgentId:", agentId, "Files:", files);
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === agentId
          ? { ...agent, knowledgeFiles: files } 
          : agent
      )
    );
    await refetchAgentData(agentId);
  }, [refetchAgentData]);


  const addExpert = useCallback(async (expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">): Promise<Expert | null> => {
    if (!currentUser?.id) { console.error("Não autenticado."); return null; }
    const expertToInsert: DbExpertInsert = {
      name: expertData.name,
      niche: expertData.niche,
      target_audience: expertData.targetAudience,
      deliverables: expertData.deliverables,
      benefits: expertData.benefits,
      objections: expertData.objections,
      avatar: expertData.avatar,
      user_id: currentUser.id,
    };
    try {
      const { data, error } = await supabase.from(EXPERTS_TABLE).insert(expertToInsert).select().single();
      if (error) { console.error("Erro ao adicionar expert:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao adicionar expert."); return null;}
      
      const newExpert = mapDbExpertToExpert(data as DbExpertRow);
      setExperts(prev => [newExpert, ...prev]);
      return newExpert;
    } catch (error) {
      console.error("Falha ao adicionar expert:", error);
      return null;
    }
  }, [currentUser, supabase, mapDbExpertToExpert]);

  const updateExpert = useCallback(async (id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>): Promise<Expert | null> => {
    if (!currentUser) { console.error("Não autenticado."); return null; }
     const expertToUpdate: Partial<DbExpertInsert> = { 
        name: expertData.name,
        niche: expertData.niche,
        target_audience: expertData.targetAudience,
        deliverables: expertData.deliverables,
        benefits: expertData.benefits,
        objections: expertData.objections,
        avatar: expertData.avatar,
        updated_at: new Date().toISOString(),
    };
    
    Object.keys(expertToUpdate).forEach(key => {
      const K = key as keyof typeof expertToUpdate;
      if (expertToUpdate[K] === undefined) {
        delete expertToUpdate[K];
      }
    });

    try {
      const { data, error } = await supabase.from(EXPERTS_TABLE).update(expertToUpdate).eq('id', id).select().single();
      if (error) { console.error("Erro ao atualizar expert:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao atualizar expert."); return null; }

      const updatedExpert = mapDbExpertToExpert(data as DbExpertRow);
      setExperts(prev => prev.map(e => e.id === id ? updatedExpert : e));
      return updatedExpert;
    } catch (error) {
      console.error("Falha ao atualizar expert:", error);
      return null;
    }
  }, [currentUser, supabase, mapDbExpertToExpert]);

  const deleteExpert = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(EXPERTS_TABLE).delete().eq('id', id);
      if (error) { console.error("Erro ao deletar expert:", error); throw error; }
      setExperts(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Falha ao deletar expert:", error);
    }
  }, [supabase]);

  const createChat = useCallback(async (copyRequest: CopyRequest): Promise<Chat | null> => {
    if (!currentUser?.id) { console.error("Não autenticado."); return null; }

    const chatToInsert: DbChatInsert = {
      title: copyRequest.userInput.substring(0, 50), 
      agent_id: copyRequest.agentId,
      expert_id: copyRequest.expertId, 
      content_type: copyRequest.contentTypeId ?? "", 
      user_id: currentUser.id,
    };
    
    if (copyRequest.expertId === undefined) {
        delete (chatToInsert as any).expert_id; 
    }
    if (!copyRequest.contentTypeId) {
        delete (chatToInsert as any).content_type; 
    }


    try {
      const { data, error } = await supabase.from(CHATS_TABLE).insert(chatToInsert).select().single();
      if (error) { console.error("Erro ao criar chat:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao criar chat."); return null; }
      
      const dbChatRow = data as DbChatRow;
      const newChat: Chat = {
        id: dbChatRow.id,
        title: dbChatRow.title,
        messages: [],
        agentId: dbChatRow.agent_id,
        expertId: dbChatRow.expert_id ?? undefined,
        contentTypeId: dbChatRow.content_type ?? undefined, 
        userId: dbChatRow.user_id,
        createdAt: new Date(dbChatRow.created_at),
        updatedAt: new Date(dbChatRow.updated_at),
      };
       if (newChat.contentTypeId) {
            const foundContentType = contentTypes.find(ct => ct.id === newChat.contentTypeId);
            if (foundContentType) {
                newChat.contentType = foundContentType;
            }
        }
      setChats(prev => [newChat, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setActiveChatId(newChat.id); 
      return newChat;
    } catch (error) {
      console.error("Falha ao criar chat:", error);
      return null;
    }
  }, [currentUser, supabase, contentTypes]);

  const addMessageToChat = useCallback(async ( 
    chatId: string, 
    messageData: Omit<Message, "id" | "createdAt" | "chatId">,
    // _agentForMessage?: Agent | null // Remover parâmetro não usado
  ): Promise<Message | null> => {
    if (!currentUser?.id && messageData.sender === 'user') { console.error("Não autenticado para enviar mensagem de usuário."); return null; }

    // Mapear sender para um role válido no banco de dados
    let dbRole: string;
    switch (messageData.sender) {
      case 'user':
        dbRole = 'user';
        break;
      case 'agent':
      case 'expert': // Mapear 'expert' para 'assistant' também, ou defina uma lógica específica se necessário
        dbRole = 'assistant';
        break;
      default:
        // Fallback para 'assistant' ou lançar um erro se o sender for inesperado
        console.warn(`Sender não esperado: ${messageData.sender}, usando 'assistant'.`);
        dbRole = 'assistant';
    }

    const messageToInsert: DbMessageInsert = {
      chat_id: chatId,
      content: messageData.text,
      role: dbRole, // Usar o dbRole mapeado
    };
    // Se agent_id existir em DbMessageInsert (ver tipos gerados):
    if (messageData.sender === 'agent' && messageData.agentId && 'agent_id' in messageToInsert) {
        (messageToInsert as any).agent_id = messageData.agentId;
    }


    try {
      const { data, error } = await supabase.from(MESSAGES_TABLE).insert(messageToInsert).select().single();
      if (error) { console.error("Erro ao adicionar mensagem:", error); throw error; }
      if (!data) { console.error("Nenhum dado retornado ao adicionar mensagem."); return null; }

      const dbMessageRow = data as DbMessageRow;
      const newMessage: Message = {
        id: dbMessageRow.id,
        text: dbMessageRow.content,
        sender: dbMessageRow.role as Message['sender'], 
        chatId: dbMessageRow.chat_id,
        createdAt: new Date(dbMessageRow.created_at),
      };
      // Se agent_id existir em dbMessageRow:
       if ('agent_id' in dbMessageRow && dbMessageRow.agent_id !== null && dbMessageRow.agent_id !== undefined) {
        newMessage.agentId = dbMessageRow.agent_id as string | undefined;
      }
      
      console.log("[DataContext AddMsg] Nova mensagem pronta para estado:", JSON.stringify(newMessage), "Para ChatID:", chatId);

      // APENAS atualiza a lista mestre de chats
      setChats(prevChats => {
        const newChats = prevChats.map(chat => { 
          if (chat.id === chatId) { 
            // Sempre cria um novo objeto de chat com a nova mensagem
            return { 
              ...chat, 
              messages: [...chat.messages, newMessage], 
              updatedAt: new Date(dbMessageRow.created_at) 
            }; 
          } 
          return chat;
        });
        return newChats.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });

      return newMessage;
    } catch (error) {
      console.error("Falha ao adicionar mensagem:", error);
      return null;
    }
  }, [currentUser, supabase]);

  const deleteChat = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(CHATS_TABLE).delete().eq('id', id);
      if (error) { console.error("Erro ao deletar chat:", error); throw error; }
      setChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) { // Limpar ID se o chat deletado era o ativo
        setActiveChatId(null);
      }
    } catch (error) {
      console.error("Falha ao deletar chat:", error);
    }
  }, [supabase, activeChatId]);

  const deleteMessageFromChat = useCallback(async (chatId: string, messageId: string): Promise<void> => {
    try {
      const { error } = await supabase.from(MESSAGES_TABLE).delete().eq('id', messageId);
      if (error) { console.error("Erro ao deletar mensagem:", error); throw error; }
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: chat.messages.filter(m => m.id !== messageId) } 
          : chat
      ));
    } catch (error) {
      console.error("Falha ao deletar mensagem:", error);
    }
  }, [supabase]);

  const generateCopy = async (request: CopyRequest, chatHistory: Message[] = []): Promise<string> => {
    console.log("[DataContext] generateCopy chamada com request:", request);
    console.log("[DataContext] generateCopy chamada com chatHistory:", chatHistory);

    if (!currentUser?.apiKey) {
      console.error("[DataContext] API Key da Groq não encontrada para o usuário.");
      return "Erro: API Key da Groq não configurada para o usuário.";
    }
    if (!request.agentId) {
      console.error("[DataContext] Agent ID não fornecido para generateCopy.");
      return "Erro: Agente não especificado.";
    }

    const agent = await getAgentById(request.agentId);
    if (!agent) {
      console.error(`[DataContext] Agente com ID ${request.agentId} não encontrado.`);
      return `Erro: Agente com ID ${request.agentId} não encontrado.`;
    }

    const contentType = await getContentTypeById(request.contentTypeId || ""); // Adicionado fallback para string vazia se undefined
    if (!contentType) {
      console.error(`[DataContext] Tipo de conteúdo com ID ${request.contentTypeId} não encontrado.`);
      // Não retornar erro fatal aqui, pode ser opcional dependendo da lógica de negócios
      // return `Erro: Tipo de conteúdo com ID ${request.contentTypeId} não encontrado.`; 
    }

    const currentTemperature = agent.temperature ?? 0.7;
    console.log(`[DataContext] Usando temperatura: ${currentTemperature} para o agente ${agent.name}`);

    let retrievedKnowledge = "Nenhum conhecimento adicional encontrado.";
    if (openai && agent.knowledgeFiles && agent.knowledgeFiles.length > 0 && request.userInput) {
      try {
        const userInputEmbeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: request.userInput,
        });
        const userInputEmbedding = userInputEmbeddingResponse.data[0].embedding;

        interface RpcChunk {
          original_file_name: string;
          chunk_text: string;
          similarity: number; // Incluindo similarity, pois o linter o mencionou e é comum em funções de match
          // Adicione outros campos se a sua RPC os retornar e você precisar deles
        }

        const { data: chunks, error: chunksError } = await supabase.rpc('match_knowledge_chunks', {
          match_agent_id: agent.id,
          query_embedding: userInputEmbedding as any, 
          match_threshold: 0.75, 
          match_count: 5 
        });

        if (chunksError) {
          console.error("[DataContext] Erro ao buscar chunks de conhecimento:", chunksError);
        } else if (chunks && chunks.length > 0) {
          retrievedKnowledge = (chunks as RpcChunk[]).map((chunk: RpcChunk) => 
            `Trecho do arquivo \"${chunk.original_file_name}\":\n${chunk.chunk_text}`
          ).join("\n\n---\n\n");
        } else {
          console.log("[DataContext] Nenhum chunk de conhecimento similar encontrado via RAG.");
        }
      } catch (ragError) {
        console.error("[DataContext] Erro durante o processo RAG:", ragError);
      }
    }
    console.log("[DataContext] Chunks de conhecimento recuperados:", retrievedKnowledge);

    const formattedHistory = chatHistory
      .map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Agente'}: ${msg.text}`)
      .join('\\n');

    const contentTypeContext = contentType 
      ? `\\n\\nContexto do Tipo de Conteúdo (${contentType.name}):\\n${contentType.description}`
      : "";

    const finalPrompt = `Contexto do Agente: ${agent.prompt}${contentTypeContext}\\n\\nConhecimento Recuperado:\\n${retrievedKnowledge}\\n\\n---\\n\\nHistórico da Conversa Anterior:\\n${formattedHistory || 'Nenhuma conversa anterior.'}\\n\\n---\\n\\nSolicitação Atual do Usuário: "${request.userInput}"\\n\\nBaseado em TODO o contexto fornecido (agente, tipo de conteúdo, conhecimento recuperado e histórico da conversa), responda à solicitação atual do Usuário. Priorize o conhecimento recuperado. Seja direto e responda apenas o que foi perguntado.`;
    
    console.log("[DataContext] Final prompt being sent to Groq:", finalPrompt);

    try {
      const groq = new Groq({ apiKey: currentUser.apiKey, dangerouslyAllowBrowser: true });
      const DEFAULT_GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"; // Definir o modelo padrão
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: finalPrompt,
          },
        ],
        model: agent.model || DEFAULT_GROQ_MODEL, // Usar agent.model ou o DEFAULT_GROQ_MODEL
        temperature: currentTemperature, 
      });
      console.log("[DataContext] Groq completion received:", completion);
      const resultText = completion.choices[0]?.message?.content || "";
      console.log("[DataContext] Result text from Groq:", resultText);
      return resultText;

    } catch (error) {
      console.error("[DataContext] Erro ao chamar API Groq:", error);
      return `Erro ao gerar cópia: ${error instanceof Error ? error.message : String(error)}`;
    }
  };


  const createContentType = useCallback(async (contentTypeData: Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">): Promise<ContentType | null> => {
    if (!currentUser?.id) { console.error("Não autenticado."); return null; }
    const contentTypeToInsert: DbContentTypeInsert = {
        name: contentTypeData.name,
        description: contentTypeData.description,
        avatar: contentTypeData.avatar,
        user_id: currentUser.id,
    };
    try {
        const { data, error } = await supabase.from(CONTENT_TYPES_TABLE).insert(contentTypeToInsert).select().single();
        if (error) { console.error("Erro ao criar content type:", error); throw error; }
        if (!data) { console.error("Nenhum dado retornado."); return null;}
        
        const newContentType = mapDbContentTypeToContentType(data as DbContentTypeRow);
        setContentTypes(prev => [newContentType, ...prev]);
        return newContentType;
    } catch (error) {
        console.error("Falha ao criar content type:", error);
        return null;
    }
  }, [currentUser, supabase, mapDbContentTypeToContentType]);

  const updateContentType = useCallback(async (id: string, contentTypeData: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt" | "userId">>): Promise<ContentType | null> => {
    if (!currentUser) { console.error("Não autenticado."); return null; }
    const contentTypeToUpdate: Partial<DbContentTypeInsert> = {
        name: contentTypeData.name,
        description: contentTypeData.description,
        avatar: contentTypeData.avatar,
        updated_at: new Date().toISOString(),
    };
     Object.keys(contentTypeToUpdate).forEach(key => {
      const K = key as keyof typeof contentTypeToUpdate;
      if (contentTypeToUpdate[K] === undefined) {
        delete contentTypeToUpdate[K];
      }
    });
    
    try {
        const { data, error } = await supabase.from(CONTENT_TYPES_TABLE).update(contentTypeToUpdate).eq('id', id).select().single();
        if (error) { console.error("Erro ao atualizar content type:", error); throw error; }
        if (!data) { console.error("Nenhum dado retornado."); return null; }
        
        const updatedContentType = mapDbContentTypeToContentType(data as DbContentTypeRow);
        setContentTypes(prev => prev.map(ct => ct.id === id ? updatedContentType : ct));
        return updatedContentType;
    } catch (error) {
        console.error("Falha ao atualizar content type:", error);
        return null;
    }
  }, [currentUser, supabase, mapDbContentTypeToContentType]);

  const deleteContentType = useCallback(async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from(CONTENT_TYPES_TABLE).delete().eq('id', id);
        if (error) { console.error("Erro ao deletar content type:", error); throw error; }
        setContentTypes(prev => prev.filter(ct => ct.id !== id));
    } catch (error) {
        console.error("Falha ao deletar content type:", error);
    }
  }, [supabase]);

  // ADAPTAR A FUNÇÃO QUE SERÁ EXPORTADA COMO setCurrentChat
  const handleSetCurrentChat = useCallback((chat: Chat | null) => {
    setActiveChatId(chat?.id ?? null);
  }, []); // Sem dependências, pois só chama setActiveChatId

  const contextValue = useMemo(() => ({
    agents, createAgent, updateAgent, deleteAgent, getAgentById, updateAgentFiles, refetchAgentData,
    experts, addExpert, updateExpert, deleteExpert,
    chats,
    setCurrentChat: handleSetCurrentChat, // Exportar a função que define o ID
    activeChatId, // Exportar o ID ativo
    createChat, 
    addMessageToChat, 
    deleteChat, 
    deleteMessageFromChat,
    generateCopy,
    contentTypes, createContentType, updateContentType, deleteContentType, getContentTypeById,
    isLoading,
  }), [
    agents, createAgent, updateAgent, deleteAgent, getAgentById, updateAgentFiles, refetchAgentData,
    experts, addExpert, updateExpert, deleteExpert,
    chats,
    activeChatId, // Adicionar activeChatId
    handleSetCurrentChat, // Adicionar handleSetCurrentChat
    createChat, 
    addMessageToChat, 
    deleteChat, 
    deleteMessageFromChat,
    generateCopy,
    contentTypes, createContentType, updateContentType, deleteContentType, getContentTypeById, // getContentTypeById está aqui agora
    isLoading
  ]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

// Exportar DataProvider como default
export default DataProvider;

// Manter useData como exportação nomeada
export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData deve ser usado dentro de um DataProvider");
  }
  return context;
}