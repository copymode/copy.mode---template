export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  apiKey?: string;
  avatar_url?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  prompt: string;
  description: string;
  temperature?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  knowledgeFiles?: KnowledgeFile[];
}

export interface KnowledgeFile {
  name: string;
  path: string;
  content?: string;
}

export interface Expert {
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  deliverables: string;
  benefits: string;
  objections: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  expertId?: string;
  agentId: string;
  contentType: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  chatId: string;
  createdAt: Date;
}

export interface CopyRequest {
  expertId?: string;
  agentId: string;
  contentType: string;
  additionalInfo: string;
}

export interface ContentType {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// This helps TypeScript recognize the available RPC functions in Supabase
declare global {
  namespace SupabaseRPC {
    type AvailableFunctions = "is_owner_of_profile" | "update_user_api_key" | "update_user_name";
  }
}
