import { useState } from "react";
import { useData } from "@/context/DataContext";
import { ExpertForm } from "@/components/experts/ExpertForm";
import { ExpertCard } from "@/components/experts/ExpertCard";
import { Expert } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Experts() {
  const { experts, addExpert, updateExpert, deleteExpert } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCreate = () => {
    setEditingExpert(null);
    setShowForm(true);
  };
  
  const handleEdit = (expert: Expert) => {
    setEditingExpert(expert);
    setShowForm(true);
  };
  
  const handleDelete = (expertId: string) => {
    setExpertToDelete(expertId);
  };
  
  const confirmDelete = async () => {
    if (expertToDelete) {
      setIsLoading(true);
      try {
        await deleteExpert(expertToDelete);
        setExpertToDelete(null);
        toast({
          title: "Expert excluído",
          description: "O expert foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir expert:", error);
        toast({
          title: "Erro ao excluir",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o expert.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSave = async (data: Expert | Omit<Expert, "id" | "createdAt" | "updatedAt" | "userId">) => {
    setIsLoading(true);
    try {
      if ('id' in data) {
        // Atualizando expert existente
        await updateExpert(data.id, data);
        toast({
          title: "Expert atualizado",
          description: "O expert foi atualizado com sucesso.",
        });
      } else {
        // Criando novo expert
        await addExpert(data);
        toast({
          title: "Expert criado",
          description: "O expert foi criado com sucesso.",
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar expert:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o expert.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meus Experts</h1>
        
        {!showForm && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Expert
          </Button>
        )}
      </div>
      
      {showForm ? (
        <div className="max-w-2xl mx-auto p-6 border rounded-lg bg-card shadow-sm">
           <h2 className="text-xl font-semibold mb-6 border-b pb-3">
             {editingExpert ? "Editar Expert" : "Criar Novo Expert"}
           </h2>
           <ExpertForm 
             initialData={editingExpert || undefined} 
             isEditing={!!editingExpert} 
             onSave={handleSave} 
             onCancel={() => setShowForm(false)} 
           />
        </div>
      ) : (
        <div className="space-y-4">
          {experts.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-background">
              <h3 className="text-lg font-medium mb-2">Nenhum expert encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhum perfil de expert.
              </p>
              <Button onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar primeiro expert
              </Button>
            </div>
          ) : (
            experts.map((expert) => (
              <ExpertCard 
                key={expert.id}
                expert={expert}
                onEdit={() => handleEdit(expert)}
                onDelete={() => handleDelete(expert.id)}
              />
            ))
          )}
        </div>
      )}
      
      {/* Delete confirmation */}
      <AlertDialog open={!!expertToDelete} onOpenChange={(isOpen) => !isOpen && setExpertToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este expert? Esta ação não pode ser desfeita.
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
