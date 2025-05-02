import { supabase } from "./client";
import { Agent, Chat, Expert, Message, User } from "@/types";
import { Database } from "./types";

// Interfaces locais para tipos não exportados globalmente
interface Document {
  id: string;
  name: string;
  content: string;
  agentId: string;
}

// Type conversions from Supabase DB types to our app types
export type DbAgent = Database["public"]["Tables"]["agents"]["Row"];
export type DbExpert = Database["public"]["Tables"]["experts"]["Row"];
export type DbChat = Database["public"]["Tables"]["chats"]["Row"];
export type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbDocument = Database["public"]["Tables"]["documents"]["Row"];

// Adapter functions to convert from DB types to app types
export function adaptAgentFromDB(dbAgent: DbAgent): Agent {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    avatar: dbAgent.avatar || undefined,
    prompt: dbAgent.prompt,
    description: dbAgent.description || "",
    createdAt: new Date(dbAgent.created_at),
    updatedAt: new Date(dbAgent.updated_at),
    createdBy: dbAgent.created_by
  };
}

export function adaptExpertFromDB(dbExpert: DbExpert): Expert {
  return {
    id: dbExpert.id,
    name: dbExpert.name,
    niche: dbExpert.niche,
    targetAudience: dbExpert.target_audience,
    deliverables: dbExpert.deliverables,
    benefits: dbExpert.benefits,
    objections: dbExpert.objections,
    createdAt: new Date(dbExpert.created_at),
    updatedAt: new Date(dbExpert.updated_at),
    userId: dbExpert.user_id
  };
}

export function adaptMessageFromDB(dbMessage: DbMessage): Message {
  return {
    id: dbMessage.id,
    content: dbMessage.content,
    role: dbMessage.role as "user" | "assistant",
    chatId: dbMessage.chat_id,
    createdAt: new Date(dbMessage.created_at)
  };
}

export function adaptChatFromDB(dbChat: DbChat, messages: Message[] = []): Chat {
  return {
    id: dbChat.id,
    title: dbChat.title,
    messages: messages,
    expertId: dbChat.expert_id || undefined,
    agentId: dbChat.agent_id,
    contentType: dbChat.content_type,
    userId: dbChat.user_id,
    createdAt: new Date(dbChat.created_at),
    updatedAt: new Date(dbChat.updated_at)
  };
}

export function adaptProfileFromDB(dbProfile: DbProfile): User {
  return {
    id: dbProfile.id,
    name: dbProfile.name || "",
    email: dbProfile.email || "",
    role: dbProfile.role as "admin" | "user",
    apiKey: dbProfile.api_key || undefined,
    avatar_url: dbProfile.avatar_url || undefined
  };
}

export function adaptDocumentFromDB(dbDocument: DbDocument): Document {
  return {
    id: dbDocument.id,
    name: dbDocument.name,
    content: dbDocument.content,
    agentId: dbDocument.agent_id
  };
}

// Functions to fetch data from Supabase
export async function fetchAgents() {
  const { data, error } = await supabase
    .from("agents")
    .select("*");
  
  if (error) throw error;
  return (data || []).map(adaptAgentFromDB);
}

export async function fetchExperts(userId?: string) {
  const query = supabase
    .from("experts")
    .select("*");
  
  if (userId) {
    query.eq("user_id", userId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []).map(adaptExpertFromDB);
}

export async function fetchChatsWithMessages(userId: string) {
  // Fetch chats
  const { data: chatsData, error: chatsError } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId);
  
  if (chatsError) throw chatsError;
  
  if (!chatsData || chatsData.length === 0) return [];
  
  // Fetch messages for all chats
  const chatIds = chatsData.map(chat => chat.id);
  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: true });
  
  if (messagesError) throw messagesError;
  
  // Group messages by chat_id
  const messagesByChatId: Record<string, Message[]> = {};
  (messagesData || []).forEach(msg => {
    if (!messagesByChatId[msg.chat_id]) {
      messagesByChatId[msg.chat_id] = [];
    }
    messagesByChatId[msg.chat_id].push(adaptMessageFromDB(msg));
  });
  
  // Create full chat objects with their messages
  return chatsData.map(chat => 
    adaptChatFromDB(chat, messagesByChatId[chat.id] || [])
  );
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // DEBUG LOG REMOVED
  // console.log('[fetchUserProfile] Raw data from Supabase:', data);
  
  if (error) {
    // Keep error logging for actual errors
    console.error('[fetchUserProfile] Error fetching profile:', error);
    throw error;
  }
  if (!data) {
    // Keep warning for missing data
    console.warn('[fetchUserProfile] Profile data not found for userId:', userId);
    throw new Error("User profile not found");
  }
  
  return adaptProfileFromDB(data);
}
