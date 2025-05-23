import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { UserCard } from "@/components/users/UserCard";
import { UserForm } from "@/components/users/UserForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Mock de dados para exemplo
const mockUsers = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@exemplo.com",
    role: "admin",
    createdAt: new Date("2024-01-01")
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@exemplo.com",
    role: "user",
    createdAt: new Date("2024-02-01")
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro@exemplo.com",
    role: "user",
    createdAt: new Date("2024-02-15")
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana@exemplo.com",
    role: "admin",
    createdAt: new Date("2024-03-01")
  },
  {
    id: "5",
    name: "Lucas Ferreira",
    email: "lucas@exemplo.com",
    role: "user",
    createdAt: new Date("2024-03-15")
  },
  {
    id: "6",
    name: "Carla Souza",
    email: "carla@exemplo.com",
    role: "user",
    createdAt: new Date("2024-03-20")
  },
  {
    id: "7",
    name: "Roberto Lima",
    email: "roberto@exemplo.com",
    role: "admin",
    createdAt: new Date("2024-03-25")
  },
  {
    id: "8",
    name: "Patricia Mendes",
    email: "patricia@exemplo.com",
    role: "user",
    createdAt: new Date("2024-04-01")
  }
];

const ITEMS_PER_PAGE = 5;

export default function Users() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<typeof mockUsers[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: typeof mockUsers[0]) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleSave = async (data: any) => {
    setIsLoading(true);
    try {
      if (editingUser) {
        // Implementar edição
        console.log("Editar usuário:", { ...data, id: editingUser.id });
        toast({
          title: "Usuário atualizado",
          description: "O usuário foi atualizado com sucesso.",
        });
      } else {
        // Implementar criação
        console.log("Criar usuário:", data);
        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso.",
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setIsLoading(true);
      try {
        // Implementar exclusão
        console.log("Excluir usuário:", userToDelete);
        setUserToDelete(null);
        toast({
          title: "Usuário excluído",
          description: "O usuário foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        toast({
          title: "Erro ao excluir",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o usuário.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filtrar usuários com base no termo de busca
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Obter usuários da página atual
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Funções de navegação
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        
        <Button 
          onClick={handleCreateUser}
          className="bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {currentUsers.map((user) => (
          <UserCard 
            key={user.id}
            user={user}
            onEdit={() => handleEdit(user)}
            onDelete={() => handleDelete(user.id)}
          />
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            initialData={editingUser || undefined}
            isEditing={!!editingUser}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 