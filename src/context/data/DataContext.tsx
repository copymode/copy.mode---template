
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useAuth } from "../AuthContext";
import { DataContextType } from "./types";
import { useAgentSlice } from "./agentSlice";
import { useExpertSlice } from "./expertSlice";
import { useChatSlice } from "./chatSlice";
import { useCopyGeneration } from "./copyGenerationSlice";
import { loadFromLocalStorage, saveToLocalStorage } from "./localStorage";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state with the slices
  const { 
    agents, setAgents, 
    createAgent, updateAgent, deleteAgent 
  } = useAgentSlice(currentUser);
  
  const { 
    experts, setExperts, 
    addExpert, updateExpert, deleteExpert 
  } = useExpertSlice(currentUser);
  
  const { 
    chats, setChats, currentChat, setCurrentChat, 
    createChat, addMessageToChat, deleteChat, deleteMessageFromChat 
  } = useChatSlice(currentUser);

  // Copy generation hook depends on other state
  const { generateCopy } = useCopyGeneration({
    currentUser,
    agents,
    experts,
    currentChat
  });

  // Load data from localStorage on initial mount
  useEffect(() => {
    const { agents: loadedAgents, experts: loadedExperts, chats: loadedChats, currentChat: loadedCurrentChat } = loadFromLocalStorage();
    
    setAgents(loadedAgents);
    setExperts(loadedExperts);
    setChats(loadedChats);
    setCurrentChat(loadedCurrentChat);
    setIsLoading(false);
  }, []); // Empty dependency array means this runs only once on mount

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToLocalStorage("agents_data", agents);
  }, [agents, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToLocalStorage("experts_data", experts);
  }, [experts, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToLocalStorage("chats_data", chats);
  }, [chats, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToLocalStorage("currentChatId_data", currentChat ? currentChat.id : null);
  }, [currentChat, isLoading]);

  // Filter data based on user role and handle loading state
  useEffect(() => {
    if (isLoading || !currentUser) return; // Wait for loading and user

    // Load data again or filter existing loaded data
    const { experts: loadedExperts, chats: loadedChats } = loadFromLocalStorage();

    if (currentUser.role === "user") {
      setExperts(loadedExperts.filter((expert: any) => expert.userId === currentUser.id));
      setChats(loadedChats.filter((chat: any) => chat.userId === currentUser.id));
    } else {
      // Admin sees all data (already loaded or from mocks)
      setExperts(loadedExperts);
      setChats(loadedChats);
    }

    // Reset currentChat if it doesn't belong to the current user or doesn't exist anymore
    if (currentChat && 
        ((currentUser.role !== 'admin' && currentChat.userId !== currentUser.id) || 
         !loadedChats.some((chat: any) => chat.id === currentChat.id))) {
      setCurrentChat(null);
    }
  }, [currentUser, isLoading, currentChat, setExperts, setChats, setCurrentChat]); 

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
    setCurrentChat,
    createChat,
    addMessageToChat,
    deleteChat,
    deleteMessageFromChat,
    
    // Copy Generation
    generateCopy
  }), [
    isLoading,
    agents, createAgent, updateAgent, deleteAgent,
    experts, addExpert, updateExpert, deleteExpert,
    chats, currentChat, setCurrentChat, createChat, addMessageToChat, deleteChat, deleteMessageFromChat,
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
