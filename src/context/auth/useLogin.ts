
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { saveUserToLocalStorage, mapSupabaseUser } from "./authUtils";
import { mockUsers } from "@/context/auth/types";

export const useLogin = (
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setSession: React.Dispatch<React.SetStateAction<any>>
) => {
  
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // For demo purposes, try to find a matching mock user by email
      const mockUser = mockUsers.find(user => user.email === email);
      
      if (mockUser) {
        console.log("Mock login success:", mockUser);
        setCurrentUser(mockUser);
        saveUserToLocalStorage(mockUser);
        return mockUser;
      }

      // If no mock user matches, try Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        return null;
      }

      if (data.user && data.session) {
        console.log("Supabase login success:", data.user);
        
        const userProfile = await mapSupabaseUser(data.user, data.session);
        setCurrentUser(userProfile);
        setSession(data.session);
        saveUserToLocalStorage(userProfile);
        
        return userProfile;
      }
    } catch (error) {
      console.error("Login error:", error);
    }
    return null;
  };

  return { login };
};
