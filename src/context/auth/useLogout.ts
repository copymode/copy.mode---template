
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { removeUserFromLocalStorage } from "./authUtils";

export const useLogout = (
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setSession: React.Dispatch<React.SetStateAction<any>>
) => {
  
  const logout = async (): Promise<void> => {
    try {
      console.log("Logging out");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      // Clean up local state
      setCurrentUser(null);
      setSession(null);
      removeUserFromLocalStorage();
    }
  };

  return { logout };
};
