
import { Agent, Expert, Chat } from "./types";

// Mock data for initial loading and development
export const mockAgents: Agent[] = [
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

export const mockExperts: Expert[] = [
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

export const mockChats: Chat[] = [
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
