
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expert } from "./types";
import { User } from "@/types";

export const useExpertSlice = (currentUser: User | null) => {
  const [experts, setExperts] = useState<Expert[]>([]);
  
  const addExpert = useCallback((expertData: Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!currentUser) return;
    
    const newExpert: Expert = {
      ...expertData,
      id: `expert-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: currentUser.id
    };
    
    setExperts(prevExperts => [...prevExperts, newExpert]);
  }, [currentUser]);
  
  const updateExpert = useCallback((id: string, expertData: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">>) => {
    if (!currentUser) return;
    
    setExperts(prevExperts =>
      prevExperts.map(expert =>
        expert.id === id && expert.userId === currentUser.id
          ? { 
              ...expert, 
              ...expertData,
              updatedAt: new Date() 
            }
          : expert
      )
    );
  }, [currentUser]);
  
  const deleteExpert = useCallback((id: string) => {
    if (!currentUser) return;
    setExperts(prevExperts => 
      prevExperts.filter(expert => !(expert.id === id && expert.userId === currentUser.id))
    );
  }, [currentUser]);
  
  return {
    experts,
    setExperts,
    addExpert,
    updateExpert,
    deleteExpert
  };
};
