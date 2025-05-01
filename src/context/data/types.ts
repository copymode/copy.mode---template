
import { User } from "@/types";

// Re-export types from the main types file
export type { Agent, Expert, Chat, Message, CopyRequest } from "@/types";

// Internal context types
export interface DataContextType {
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
