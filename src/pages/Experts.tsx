
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { ExpertForm } from "@/components/experts/ExpertForm";
import { ExpertCard } from "@/components/experts/ExpertCard";
import { Expert } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Experts() {
  const { experts, deleteExpert } = useData();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expertToEdit, setExpertToEdit] = useState<Expert | null>(null);
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null);
  
  const handleCreateClick = () => {
    setIsCreating(true);
    setIsEditing(false);
    setExpertToEdit(null);
  };
  
  const handleEditClick = (expert: Expert) => {
    setIsEditing(true);
    setIsCreating(false);
    setExpertToEdit(expert);
  };
  
  const handleCancelForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setExpertToEdit(null);
  };
  
  const handleDeleteClick = (id: string) => {
    setExpertToDelete(id);
  };
  
  const confirmDelete = () => {
    if (expertToDelete) {
      deleteExpert(expertToDelete);
      setExpertToDelete(null);
      toast({
        title: "Expert excluído",
        description: "O expert foi excluído com sucesso.",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Experts</h1>
          <p className="text-muted-foreground">
            Crie e gerencie perfis de especialistas para suas copies
          </p>
        </div>
        
        {!isCreating && !isEditing && (
          <Button onClick={handleCreateClick}>
            <Plus size={16} className="mr-2" />
            Novo Expert
          </Button>
        )}
      </div>
      
      {(isCreating || isEditing) ? (
        <div className="max-w-2xl mx-auto">
          <ExpertForm 
            onCancel={handleCancelForm}
            initialData={expertToEdit || undefined}
            isEditing={isEditing}
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
              <Button onClick={handleCreateClick}>
                <Plus size={16} className="mr-2" />
                Criar primeiro expert
              </Button>
            </div>
          ) : (
            experts.map((expert) => (
              <ExpertCard 
                key={expert.id}
                expert={expert}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>
      )}
      
      {/* Delete confirmation */}
      <AlertDialog open={!!expertToDelete} onOpenChange={(open) => !open && setExpertToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o expert
              selecionado e todas as suas informações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
