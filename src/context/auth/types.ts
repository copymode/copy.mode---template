
import { User } from "@/types";

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateUserApiKey: (apiKey: string) => Promise<void>;
  isLoading: boolean;
}

// Mock user data
export const mockUsers: User[] = [
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
