import { useState } from "react";
import { useData } from "@/context/DataContext";
import { AgentForm } from "@/components/agents/AgentForm";
import { AgentCard } from "@/components/agents/AgentCard";
import { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { agents } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  
  const handleCreateClick = () => {
    setEditingAgent(null);
    setShowForm(true);
  };
  
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
  };
  
  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setShowForm(true);
  };
  
  const handleDeleteClick = (id: string) => {
    setAgentToDelete(id);
  };
  
  const confirmDelete = async () => {
    if (agentToDelete) {
      try {
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
      
      {showForm ? (
        <div className="mb-8">
          <AgentForm 
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
                onEdit={() => handleEditClick(agent)}
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
