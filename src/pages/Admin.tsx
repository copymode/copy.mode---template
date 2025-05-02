import { useState, useCallback } from "react";
import { useData } from "@/context/DataContext";
import { AgentForm } from "@/components/agents/AgentForm";
import { AgentCard } from "@/components/agents/AgentCard";
import { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { agents, getAgentById, deleteAgent } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleCreateClick = () => {
    setEditingAgent(null);
    setShowForm(true);
  };
  
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
  };
  
  const handleEditClick = useCallback(async (agentId: string) => {
    setIsLoadingEdit(true);
    setEditingAgent(null);
    setShowForm(false);
    
    try {
      const agentToEdit = await getAgentById(agentId);
      if (agentToEdit) {
        setEditingAgent(agentToEdit);
        setShowForm(true);
      } else {
        console.error(`Agent with ID ${agentId} not found via getAgentById.`);
        toast({ title: "Erro", description: "Agente não encontrado.", variant: "destructive"});
      }
    } catch (error) {
        console.error(`Error in handleEditClick calling getAgentById for ${agentId}:`, error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível carregar os dados do agente.", variant: "destructive"});
    } finally {
        setIsLoadingEdit(false);
    }
  }, [getAgentById, toast]);
  
  const handleDeleteClick = (id: string) => {
    setAgentToDelete(id);
  };
  
  const confirmDelete = async () => {
    if (agentToDelete) {
      try {
        setIsDeleting(true);
        await deleteAgent(agentToDelete);
        setAgentToDelete(null);
        toast({
          title: "Agente excluído",
          description: "O agente foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir agente:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o agente.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Agentes</h1>
          <p className="text-muted-foreground">
            Crie e gerencie agentes de IA para seus usuários
          </p>
        </div>
        
        {!showForm && (
          <Button onClick={handleCreateClick}>
            <Plus size={16} className="mr-2" />
            Novo Agente
          </Button>
        )}
      </div>
      
      {isLoadingEdit && (
         <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      )}

      {showForm ? (
        <div className="mb-8">
          <AgentForm 
            key={editingAgent ? editingAgent.id : 'new'}
            onCancel={handleFormCancel} 
            agentToEdit={editingAgent} 
          />
        </div>
      ) : (
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-background">
              <h3 className="text-lg font-medium mb-2">Nenhum agente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhum agente de IA.
              </p>
              <Button onClick={handleCreateClick}>
                <Plus size={16} className="mr-2" />
                Criar primeiro agente
              </Button>
            </div>
          ) : (
            agents.map((agent) => (
              <AgentCard 
                key={agent.id}
                agent={agent}
                onEdit={() => handleEditClick(agent.id)}
                onDelete={() => handleDeleteClick(agent.id)}
              />
            ))
          )}
        </div>
      )}
      
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o agente
              selecionado e todas as suas configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
