
import { User } from "@/types";
import { updateUserProfile } from "@/integrations/supabase/adapter";
import { saveUserToLocalStorage } from "./authUtils";

export const useUpdateUserApiKey = (
  currentUser: User | null,
  session: any | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  
  const updateUserApiKey = async (apiKey: string): Promise<void> => {
    if (!currentUser) {
      console.error("Cannot update API key: No user logged in");
      throw new Error("Não foi possível atualizar a chave API: Usuário não logado");
    }
    
    try {
      console.log("Updating API key for user:", currentUser.id);
      
      // Update for mock user
      if (!session) {
        console.log("Updating mock user API key");
        const updatedUser = {
          ...currentUser,
          apiKey
        };
        setCurrentUser(updatedUser);
        saveUserToLocalStorage(updatedUser);
        return;
      }
      
      // Update for Supabase user - with better error handling
      try {
        const updatedUser = await updateUserProfile(currentUser.id, { apiKey });
        console.log("API key updated successfully:", updatedUser);
        
        // Update local state
        setCurrentUser(updatedUser);
      } catch (error: any) {
        console.error("Error updating API key in Supabase:", error);
        
        // Fallback to localStorage if Supabase update fails
        console.log("Falling back to local storage for API key");
        const updatedUser = {
          ...currentUser,
          apiKey
        };
        setCurrentUser(updatedUser);
        saveUserToLocalStorage(updatedUser);
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      throw error;
    }
  };

  return { updateUserApiKey };
};
