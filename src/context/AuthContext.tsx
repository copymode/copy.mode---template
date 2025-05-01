
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";

// Mock user data
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
  login: (email: string) => Promise<User | null>;
  logout: () => void;
  updateUserApiKey: (apiKey: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for user in localStorage
    const savedUser = localStorage.getItem("copymode_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string): Promise<User | null> => {
    // In a real app, this would be an API call
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("copymode_user", JSON.stringify(user));
      return user;
    }
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("copymode_user");
  };

  const updateUserApiKey = (apiKey: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, apiKey };
      setCurrentUser(updatedUser);
      localStorage.setItem("copymode_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUserApiKey }}>
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
