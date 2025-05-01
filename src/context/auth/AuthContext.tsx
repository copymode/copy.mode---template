
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { AuthContextType } from "./types";
import { checkInitialSession } from "./authUtils";
import { useLogin } from "./useLogin";
import { useLogout } from "./useLogout";
import { useUpdateUserApiKey } from "./useUpdateUserApiKey";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Import hooks
  const { login } = useLogin(setCurrentUser, setSession);
  const { logout } = useLogout(setCurrentUser, setSession);
  const { updateUserApiKey } = useUpdateUserApiKey(currentUser, session, setCurrentUser);
  
  // Set up auth state listener and check for existing session
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        // Fetch user profile when session changes
        if (newSession?.user) {
          console.log("New session detected, fetching user profile");
          // Use setTimeout to prevent deadlock with Auth state change
          setTimeout(async () => {
            try {
              const fetchUserProfile = (await import("@/integrations/supabase/adapter")).fetchUserProfile;
              const user = await fetchUserProfile(newSession.user.id);
              console.log("User profile fetched:", user);
              setCurrentUser(user);
            } catch (err) {
              console.error("Error fetching user profile:", err);
              // If profile fetch fails, set basic user info
              setCurrentUser({
                id: newSession.user.id,
                name: newSession.user.email || "",
                email: newSession.user.email || "",
                role: "user"
              });
            }
          }, 0);
        } else {
          setCurrentUser(null);
        }
      }
    );
    
    // Check for existing session
    checkInitialSession().then(({ initialUser, initialSession }) => {
      setCurrentUser(initialUser);
      setSession(initialSession);
      setIsLoading(false);
    });
    
    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUserApiKey, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
