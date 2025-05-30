import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { fetchUserProfile } from "@/integrations/supabase/adapter";

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@copymode.com",
    role: "admin"
  },
  {
    id: "user-1",
    name: "Usuário Demo",
    email: "user@example.com",
    role: "user"
  }
];

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserApiKey: (apiKey: string) => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id)
              .then(user => {
                // If user has a stored API key in localStorage, add it to the user object (from upstream)
                const storedApiKey = localStorage.getItem("copymode_user_api_key");
                if (storedApiKey && user) {
                  user.apiKey = storedApiKey;
                }
                
                // Se o usuário tem uma URL de avatar nos metadados da autenticação, use essa URL
                if (newSession.user.user_metadata?.avatar_url && user) {
                  user.avatar_url = newSession.user.user_metadata.avatar_url;
                }
                
                console.log("AUTH: Usuário carregado com avatar_url:", user?.avatar_url);
                setCurrentUser(user);
              })
              .catch(err => {
                console.error("Error fetching user profile on auth change:", err);
                // If profile fetch fails, set basic user info (from upstream)
                const storedApiKey = localStorage.getItem("copymode_user_api_key");
                setCurrentUser({
                  id: newSession.user.id,
                  name: newSession.user.email || "",
                  email: newSession.user.email || "",
                  role: "user",
                  apiKey: storedApiKey || undefined,
                  avatar_url: newSession.user.user_metadata?.avatar_url || null,
                });
              });
          }, 0);
        } else {
          setCurrentUser(null);
        }
      }
    );
    
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id)
          .then(user => {
             // If user has a stored API key in localStorage, add it to the user object (from upstream)
            const storedApiKey = localStorage.getItem("copymode_user_api_key");
            if (storedApiKey && user) {
              user.apiKey = storedApiKey;
            }
            
            // Se o usuário tem uma URL de avatar nos metadados da autenticação, use essa URL
            if (initialSession.user.user_metadata?.avatar_url && user) {
              user.avatar_url = initialSession.user.user_metadata.avatar_url;
            }
            
            console.log("AUTH: Carregando sessão inicial com avatar_url:", user?.avatar_url);
            setCurrentUser(user);
            setSession(initialSession);
          })
          .catch(err => {
            console.error("Error fetching initial user profile:", err);
            // Fallback to basic user info (from upstream)
            const storedApiKey = localStorage.getItem("copymode_user_api_key");
            setCurrentUser({
              id: initialSession.user.id,
              name: initialSession.user.email || "",
              email: initialSession.user.email || "",
              role: "user",
              apiKey: storedApiKey || undefined,
              avatar_url: initialSession.user.user_metadata?.avatar_url || null,
            });
            setSession(initialSession);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Keep the commented out localStorage logic (from stash, but was already commented)
  /* DISABLED FOR DEBUGGING API KEY ISSUE
  useEffect(() => {
    if (!session) {
      // Check for user in localStorage (for demo purposes)
      const savedUser = localStorage.getItem("copymode_user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
        } catch (error) {
          console.error("Error parsing saved user:", error);
        }
      }
      // Note: This might have caused issues if it set isLoading false too early
      // setIsLoading(false); 
    }
  }, [session]);
  */

  // Keep login function from upstream
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
         // Add localStorage key check here too after login fetch (consistent with upstream logic)
        const storedApiKey = localStorage.getItem("copymode_user_api_key");
        if (storedApiKey && userProfile) {
          userProfile.apiKey = storedApiKey;
        }
        return userProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      
      // Fallback to mock users for demo
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("copymode_user", JSON.stringify(user));
      }
      return user || null;
    }
  };

  // Keep logout function from upstream (includes removing api key from localStorage)
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem("copymode_user");
      localStorage.removeItem("copymode_user_api_key");
    }
  };

  // Keep updateUserApiKey function from upstream (uses RPC and localStorage fallback)
  const updateUserApiKey = async (apiKey: string): Promise<void> => {
    if (!currentUser) return;
    
    try {
      localStorage.setItem("copymode_user_api_key", apiKey);

      if (session) {
        try {
          const { error } = await supabase.rpc('update_user_api_key', {
            api_key_value: apiKey
          });
          
          if (error) {
            console.error("Supabase RPC update failed, using localStorage only:", error);
          }
        } catch (supabaseError) {
          console.error("Error during Supabase update, using localStorage only:", supabaseError);
        }
      }
      
      const updatedUser = { ...currentUser, apiKey };
      setCurrentUser(updatedUser);
      
      if (!session) {
        localStorage.setItem("copymode_user", JSON.stringify(updatedUser));
      }
      
      console.log("API key updated successfully (local state):", apiKey ? "key set" : "key cleared");
    } catch (error) {
      console.error("Error updating API key:", error);
      throw error;
    }
  };

  // Nova função para atualizar o avatar do usuário sem reload
  const updateUserAvatar = async (avatarUrl: string): Promise<void> => {
    if (!currentUser) return;
    
    try {
      // Criar uma cópia atualizada do usuário com o novo avatar
      const updatedUser = { ...currentUser, avatar_url: avatarUrl };
      
      // Atualizar o estado local
      setCurrentUser(updatedUser);
      
      console.log("Avatar do usuário atualizado no contexto com sucesso:", avatarUrl);
    } catch (error) {
      console.error("Erro ao atualizar avatar no contexto:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      session, 
      login, 
      logout, 
      updateUserApiKey, 
      updateUserAvatar, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Keep useAuth hook from upstream
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
