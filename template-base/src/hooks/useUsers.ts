import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface UseUsersReturn {
  // Estados
  users: User[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  
  // Funções
  fetchUsers: (page: number) => Promise<void>;
  createUser: (data: { name: string; email: string; password: string }) => Promise<void>;
  updateUser: (id: string, data: { name?: string; email?: string; password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { toast } = useToast();
  
  // Constantes
  const PER_PAGE = 5;

  // Função principal de busca
  const fetchUsers = async (page: number) => {
    console.log("Iniciando fetchUsers com página:", page);
    try {
      setIsLoading(true);
      
      // Calcula o range para paginação
      const from = (page - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;
      
      console.log("Buscando usuários no range:", { from, to });
      
      // Busca apenas usuários com role "user"
      const { data: profiles, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "user")
        .range(from, to);
        
      if (error) {
        console.error("Erro na busca:", error);
        throw error;
      }
      
      console.log("Dados recebidos:", { profiles, count });
      
      // Formata os dados para manter a estrutura atual
      const formattedUsers: User[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "user",
        createdAt: new Date() // Voltamos para a data atual já que não temos created_at
      }));
      
      console.log("Usuários formatados:", formattedUsers);
      
      setUsers(formattedUsers);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / PER_PAGE));
      
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Por enquanto retornamos apenas a função de busca
  // As outras funções serão implementadas após sua aprovação
  return {
    users,
    isLoading,
    currentPage,
    totalPages,
    fetchUsers,
    createUser: async () => {}, // será implementado depois
    updateUser: async () => {}, // será implementado depois
    deleteUser: async () => {}, // será implementado depois
  };
} 