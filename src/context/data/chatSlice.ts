
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Chat, Message, CopyRequest } from "./types";
import { User } from "@/types";

export const useChatSlice = (currentUser: User | null) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  
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
  
  return {
    chats,
    setChats,
    currentChat,
    setCurrentChat: stableSetCurrentChat,
    createChat,
    addMessageToChat,
    deleteChat,
    deleteMessageFromChat
  };
};
