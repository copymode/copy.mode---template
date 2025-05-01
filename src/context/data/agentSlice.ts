
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Agent } from "./types";
import { User } from "@/types";

export const useAgentSlice = (currentUser: User | null) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const createAgent = useCallback((agent: Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    const newAgent: Agent = {
      ...agent,
      id: `agent-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.id
    };
    
    setAgents(prevAgents => [...prevAgents, newAgent]);
  }, [currentUser]);
  
  const updateAgent = useCallback((id: string, agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "createdBy">>) => {
    if (!currentUser || currentUser.role !== "admin") return;
    
    setAgents(prevAgents =>
      prevAgents.map(agent =>
        agent.id === id
          ? { ...agent, ...agentData, updatedAt: new Date() }
          : agent
      )
    );
  }, [currentUser]);
  
  const deleteAgent = useCallback((id: string) => {
    if (!currentUser || currentUser.role !== "admin") return;
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== id));
  }, [currentUser]);
  
  return {
    agents,
    setAgents,
    createAgent,
    updateAgent,
    deleteAgent
  };
};
