import { useState } from "react";
import { useData } from "@/context/DataContext";
import { ExpertForm } from "@/components/experts/ExpertForm";
import { ExpertCard } from "@/components/experts/ExpertCard";
import { Expert } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Experts() {
  const { experts, addExpert, updateExpert, deleteExpert } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null);
  
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

  const handleSave = (expertData: Omit<Expert, 'id'> | Expert) => {
    try {
      if ('id' in expertData && expertData.id) {
        updateExpert(expertData.id, expertData);
        toast({ title: "Expert atualizado com sucesso!" });
      } else {
        addExpert(expertData as Omit<Expert, 'id'>);
        toast({ title: "Expert criado com sucesso!" });
      }
      setShowForm(false);
      setEditingExpert(null);
    } catch (error) {
      toast({ title: "Erro ao salvar Expert", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
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
        
        {!showForm && (
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Novo Expert
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
                onEdit={handleEdit}
                onDelete={handleDelete}
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
