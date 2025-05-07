import { useState, useCallback } from "react";
import { useData } from "@/hooks/useData";
import { AgentForm } from "@/components/agents/AgentForm";
import { AgentCard } from "@/components/agents/AgentCard";
import { ContentTypeForm } from "@/components/content-types/ContentTypeForm";
import { ContentTypeCard } from "@/components/content-types/ContentTypeCard";
import { Agent, ContentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Loader2, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { agents, getAgentById, deleteAgent, contentTypes, getContentTypeById, deleteContentType } = useData();
  const { toast } = useToast();
  
  // Estado para Agentes
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isLoadingAgentEdit, setIsLoadingAgentEdit] = useState(false);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  
  // Estado para Tipos de Conteúdo
  const [showContentTypeForm, setShowContentTypeForm] = useState(false);
  const [editingContentType, setEditingContentType] = useState<ContentType | null>(null);
  const [contentTypeToDelete, setContentTypeToDelete] = useState<string | null>(null);
  const [isLoadingContentTypeEdit, setIsLoadingContentTypeEdit] = useState(false);
  const [isDeletingContentType, setIsDeletingContentType] = useState(false);
  
  // Estado geral
  const [activeTab, setActiveTab] = useState("agents");
  
  // Handlers para Agentes
  const handleCreateAgentClick = () => {
    setEditingAgent(null);
    setShowAgentForm(true);
  };
  
  const handleAgentFormCancel = () => {
    setShowAgentForm(false);
    setEditingAgent(null);
  };
  
  const handleEditAgentClick = useCallback(async (agentId: string) => {
    setIsLoadingAgentEdit(true);
    setEditingAgent(null);
    setShowAgentForm(false);
    
    try {
      const agentToEdit = await getAgentById(agentId);
      if (agentToEdit) {
        setEditingAgent(agentToEdit);
        setShowAgentForm(true);
      } else {
        console.error(`Agent with ID ${agentId} not found via getAgentById.`);
        toast({ title: "Erro", description: "Agente não encontrado.", variant: "destructive"});
      }
    } catch (error) {
        console.error(`Error in handleEditAgentClick calling getAgentById for ${agentId}:`, error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível carregar os dados do agente.", variant: "destructive"});
    } finally {
        setIsLoadingAgentEdit(false);
    }
  }, [getAgentById, toast]);
  
  const handleDeleteAgentClick = (id: string) => {
    setAgentToDelete(id);
  };
  
  const confirmDeleteAgent = async () => {
    if (agentToDelete) {
      try {
        setIsDeletingAgent(true);
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
        setIsDeletingAgent(false);
      }
    }
  };
  
  // Handlers para Tipos de Conteúdo
  const handleCreateContentTypeClick = () => {
    setEditingContentType(null);
    setShowContentTypeForm(true);
  };
  
  const handleContentTypeFormCancel = () => {
    setShowContentTypeForm(false);
    setEditingContentType(null);
  };
  
  const handleEditContentTypeClick = useCallback(async (contentTypeId: string) => {
    setIsLoadingContentTypeEdit(true);
    setEditingContentType(null);
    setShowContentTypeForm(false);
    
    try {
      const contentTypeToEdit = await getContentTypeById(contentTypeId);
      if (contentTypeToEdit) {
        setEditingContentType(contentTypeToEdit);
        setShowContentTypeForm(true);
      } else {
        console.error(`ContentType with ID ${contentTypeId} not found.`);
        toast({ title: "Erro", description: "Tipo de conteúdo não encontrado.", variant: "destructive"});
      }
    } catch (error) {
      console.error(`Error loading content type ${contentTypeId}:`, error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar os dados do tipo de conteúdo.", variant: "destructive"});
    } finally {
      setIsLoadingContentTypeEdit(false);
    }
  }, [getContentTypeById, toast]);
  
  const handleDeleteContentTypeClick = (id: string) => {
    setContentTypeToDelete(id);
  };
  
  const confirmDeleteContentType = async () => {
    if (contentTypeToDelete) {
      try {
        setIsDeletingContentType(true);
        await deleteContentType(contentTypeToDelete);
        setContentTypeToDelete(null);
        toast({
          title: "Tipo de conteúdo excluído",
          description: "O tipo de conteúdo foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir tipo de conteúdo:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o tipo de conteúdo.",
          variant: "destructive",
        });
      } finally {
        setIsDeletingContentType(false);
      }
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <Tabs defaultValue="agents" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col mb-6 gap-4">
          <div className="w-full">
            <TabsList>
              <TabsTrigger value="agents">Agentes</TabsTrigger>
              <TabsTrigger value="contentTypes">Tipos de Conteúdo</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="w-full flex justify-end">
            {activeTab === "agents" && !showAgentForm && (
              <Button onClick={handleCreateAgentClick}>
                <Plus size={16} className="mr-2" />
                Novo Agente
              </Button>
            )}
            
            {activeTab === "contentTypes" && !showContentTypeForm && (
              <Button onClick={handleCreateContentTypeClick}>
                <Plus size={16} className="mr-2" />
                Novo Tipo de Conteúdo
              </Button>
            )}
          </div>
        </div>
        
        {isLoadingAgentEdit && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {isLoadingContentTypeEdit && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <TabsContent value="agents" className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Agentes</h1>
            <p className="text-muted-foreground">
              Crie e gerencie agentes de IA para seus usuários
            </p>
          </div>

          {showAgentForm ? (
            <div className="mb-8">
              <AgentForm 
                key={editingAgent ? editingAgent.id : 'new'}
                onCancel={handleAgentFormCancel} 
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
                  <Button onClick={handleCreateAgentClick}>
                    <Plus size={16} className="mr-2" />
                    Criar primeiro agente
                  </Button>
                </div>
              ) : (
                agents.map((agent) => (
                  <AgentCard 
                    key={agent.id}
                    agent={agent}
                    onEdit={() => handleEditAgentClick(agent.id)}
                    onDelete={() => handleDeleteAgentClick(agent.id)}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="contentTypes" className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Tipos de Conteúdo</h1>
            <p className="text-muted-foreground">
              Crie e gerencie os tipos de conteúdo disponíveis para a geração de copy
            </p>
          </div>
          
          {showContentTypeForm ? (
            <div className="mb-8">
              <ContentTypeForm 
                key={editingContentType ? editingContentType.id : 'new'}
                onCancel={handleContentTypeFormCancel} 
                contentTypeToEdit={editingContentType} 
              />
            </div>
          ) : (
            <div className="space-y-4">
              {contentTypes.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-background">
                  <h3 className="text-lg font-medium mb-2">Nenhum tipo de conteúdo encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não criou nenhum tipo de conteúdo.
                  </p>
                  <Button onClick={handleCreateContentTypeClick}>
                    <Plus size={16} className="mr-2" />
                    Criar primeiro tipo de conteúdo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contentTypes.map((contentType) => (
                    <ContentTypeCard 
                      key={contentType.id}
                      contentType={contentType}
                      onEdit={() => handleEditContentTypeClick(contentType.id)}
                      onDelete={() => handleDeleteContentTypeClick(contentType.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de confirmação para exclusão de agente */}
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
            <AlertDialogCancel disabled={isDeletingAgent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAgent} disabled={isDeletingAgent} className="bg-destructive text-destructive-foreground">
              {isDeletingAgent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmação para exclusão de tipo de conteúdo */}
      <AlertDialog open={!!contentTypeToDelete} onOpenChange={(open) => !open && setContentTypeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o tipo de conteúdo
              selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingContentType}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContentType} disabled={isDeletingContentType} className="bg-destructive text-destructive-foreground">
              {isDeletingContentType ? (
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
