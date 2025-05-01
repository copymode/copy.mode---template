
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
  const { agents, deleteAgent } = useData();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  
  const handleCreateClick = () => {
    setIsCreating(true);
  };
  
  const handleCancelCreate = () => {
    setIsCreating(false);
  };
  
  const handleEditAgent = (agent: Agent) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de agentes estará disponível em breve!",
    });
  };
  
  const handleDeleteClick = (id: string) => {
    setAgentToDelete(id);
  };
  
  const confirmDelete = () => {
    if (agentToDelete) {
      deleteAgent(agentToDelete);
      setAgentToDelete(null);
      toast({
        title: "Agente excluído",
        description: "O agente foi excluído com sucesso.",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Agentes</h1>
          <p className="text-muted-foreground">
            Crie e gerencie agentes de IA para seus usuários
          </p>
        </div>
        
        {!isCreating && (
          <Button onClick={handleCreateClick}>
            <Plus size={16} className="mr-2" />
            Novo Agente
          </Button>
        )}
      </div>
      
      {isCreating ? (
        <div className="max-w-2xl mx-auto">
          <AgentForm onCancel={handleCancelCreate} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.length === 0 ? (
            <div className="col-span-full text-center p-8 border rounded-lg bg-background">
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
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => handleDeleteClick(agent.id)}
              />
            ))
          )}
        </div>
      )}
      
      {/* Delete confirmation */}
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
