
import { useState } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from "@/integrations/supabase/adapter";
import { mockUsers, saveUserToLocalStorage } from "./authUtils";

export const useLogin = (
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
) => {
  const [loginLoading, setLoginLoading] = useState(false);
  
  const login = async (email: string, password: string): Promise<User | null> => {
    setLoginLoading(true);
    
    try {
      console.log("Attempting login with:", email);
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        throw error;
      }
      
      if (data.user) {
        console.log("Login successful, fetching user profile");
        const userProfile = await fetchUserProfile(data.user.id);
        return userProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      
      // Fallback to mock users for demo
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        console.log("Using mock user for login:", user);
        setCurrentUser(user);
        saveUserToLocalStorage(user);
        return user;
      }
      return null;
    } finally {
      setLoginLoading(false);
    }
  };

  return { login, loginLoading };
};
