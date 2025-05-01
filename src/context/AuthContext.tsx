
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
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserApiKey: (apiKey: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Set up auth state listener and check for existing session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        
        // Fetch user profile when session changes
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id)
              .then(user => setCurrentUser(user))
              .catch(err => {
                console.error("Error fetching user profile:", err);
                // If profile fetch fails, set basic user info
                setCurrentUser({
                  id: newSession.user.id,
                  name: newSession.user.email || "",
                  email: newSession.user.email || "",
                  role: "user"
                });
              });
          }, 0);
        } else {
          setCurrentUser(null);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id)
          .then(user => {
            setCurrentUser(user);
            setSession(initialSession);
          })
          .catch(err => {
            console.error("Error fetching initial user profile:", err);
            // Fallback to basic user info
            setCurrentUser({
              id: initialSession.user.id,
              name: initialSession.user.email || "",
              email: initialSession.user.email || "",
              role: "user"
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
  
  // For development/demo purposes, also check localStorage for mock users
  useEffect(() => {
    if (!session) {
      // Check for user in localStorage (for demo purposes)
      const savedUser = localStorage.getItem("copymode_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    }
  }, [session]);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
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
        return user;
      }
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      // Clean up local state
      setCurrentUser(null);
      localStorage.removeItem("copymode_user");
    }
  };

  const updateUserApiKey = async (apiKey: string): Promise<void> => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ api_key: apiKey })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Update local state
      setCurrentUser({ ...currentUser, apiKey });
      
      // Also update localStorage for mock users (demo only)
      if (!session) {
        localStorage.setItem("copymode_user", JSON.stringify({ ...currentUser, apiKey }));
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      throw error;
    }
  };

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
