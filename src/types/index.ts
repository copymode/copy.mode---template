
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
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  name: string;
  content: string;
  agentId: string;
}

export interface Expert {
  id: string;
  name: string;
  niche: string;
  targetAudience: string;
  deliverables: string;
  benefits: string;
  objections: string;
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
