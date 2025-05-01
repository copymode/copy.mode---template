
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { fetchUserProfile, updateUserProfile } from "@/integrations/supabase/adapter";

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
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Checking for existing session");
      
      if (initialSession?.user) {
        console.log("Initial session found, fetching user profile");
        fetchUserProfile(initialSession.user.id)
          .then(user => {
            console.log("Initial user profile fetched:", user);
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
        console.log("No initial session found");
        setIsLoading(false);
      }
    });
    
    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);
  
  // For development/demo purposes, also check localStorage for mock users
  useEffect(() => {
    if (!session) {
      console.log("No session, checking localStorage for mock user");
      // Check for user in localStorage (for demo purposes)
      const savedUser = localStorage.getItem("copymode_user");
      if (savedUser) {
        console.log("Mock user found in localStorage");
        try {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
        } catch (e) {
          console.error("Error parsing saved user:", e);
        }
      }
      setIsLoading(false);
    }
  }, [session]);

  const login = async (email: string, password: string): Promise<User | null> => {
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
        localStorage.setItem("copymode_user", JSON.stringify(user));
        return user;
      }
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("Logging out");
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
    if (!currentUser) {
      console.error("Cannot update API key: No user logged in");
      throw new Error("Não foi possível atualizar a chave API: Usuário não logado");
    }
    
    try {
      console.log("Updating API key for user:", currentUser.id);
      
      // Atualização para mock user
      if (!session) {
        console.log("Updating mock user API key");
        const updatedUser = {
          ...currentUser,
          apiKey
        };
        setCurrentUser(updatedUser);
        localStorage.setItem("copymode_user", JSON.stringify(updatedUser));
        return;
      }
      
      // Atualização para usuário do Supabase
      const updatedUser = await updateUserProfile(currentUser.id, { apiKey });
      console.log("API key updated successfully:", updatedUser);
      
      // Update local state
      setCurrentUser(updatedUser);
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
