
import { Agent, Expert, Chat } from "./types";
import { mockAgents, mockExperts, mockChats } from "./mockData";

// Helper function to load data from localStorage
export const loadFromLocalStorage = () => {
  try {
    const storedAgents = localStorage.getItem("agents_data");
    const storedExperts = localStorage.getItem("experts_data");
    const storedChats = localStorage.getItem("chats_data");
    const storedCurrentChatId = localStorage.getItem("currentChatId_data");

    const loadedAgents = storedAgents 
      ? JSON.parse(storedAgents) 
      : mockAgents;

    const loadedExperts = storedExperts 
      ? JSON.parse(storedExperts) 
      : mockExperts;

    const loadedChats = storedChats 
      ? JSON.parse(storedChats, (key, value) => {
          // Revive dates from ISO strings
          if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        }) 
      : mockChats;

    let currentChat = null;
    if (storedCurrentChatId && storedCurrentChatId !== 'null') {
      currentChat = loadedChats.find((chat: Chat) => chat.id === storedCurrentChatId) || null;
    }

    return {
      agents: loadedAgents,
      experts: loadedExperts,
      chats: loadedChats,
      currentChat
    };
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    // Fallback to mock data if parsing fails
    return {
      agents: mockAgents,
      experts: mockExperts,
      chats: mockChats,
      currentChat: null
    };
  }
};

// Helper function to save data to localStorage
export const saveToLocalStorage = (
  key: string, 
  data: Agent[] | Expert[] | Chat[] | string | null
) => {
  try {
    if (data === null && key === "currentChatId_data") {
      localStorage.setItem(key, "null");
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};
