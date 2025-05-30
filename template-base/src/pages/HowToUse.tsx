import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Play } from "lucide-react";
import { TutorialCard } from "@/components/tutorials/TutorialCard";
import { VideoModal } from "@/components/tutorials/VideoModal";
import { TutorialForm } from "@/components/tutorials/TutorialForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTutorials, type Tutorial } from "@/hooks/useTutorials";

export default function HowToUse() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { 
    tutorials, 
    loading, 
    error, 
    createTutorial, 
    updateTutorial, 
    deleteTutorial, 
    moveTutorialUp, 
    moveTutorialDown 
  } = useTutorials();
  
  const [selectedVideo, setSelectedVideo] = useState<{title: string, url: string} | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [tutorialToDelete, setTutorialToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = (tutorial: Tutorial) => {
    setSelectedVideo({
      title: tutorial.title,
      url: tutorial.youtube_url
    });
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const handleCreate = () => {
    setEditingTutorial(null);
    setShowForm(true);
  };

  const handleEdit = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setShowForm(true);
  };

  const handleDelete = (tutorial: Tutorial) => {
    setTutorialToDelete(tutorial.id);
  };

  const handleMoveUp = async (tutorialId: string) => {
    try {
      await moveTutorialUp(tutorialId);
      toast({
        title: "Tutorial reordenado",
        description: "O tutorial foi movido para cima na lista.",
      });
    } catch (error) {
      console.error('Erro ao mover tutorial:', error);
      toast({
        title: "Erro ao reordenar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao mover o tutorial.",
        variant: "destructive",
      });
    }
  };

  const handleMoveDown = async (tutorialId: string) => {
    try {
      await moveTutorialDown(tutorialId);
      toast({
        title: "Tutorial reordenado",
        description: "O tutorial foi movido para baixo na lista.",
      });
    } catch (error) {
      console.error('Erro ao mover tutorial:', error);
      toast({
        title: "Erro ao reordenar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao mover o tutorial.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (data: any) => {
    setIsLoading(true);
    try {
      if (editingTutorial) {
        // Atualizar tutorial existente
        await updateTutorial({ ...data, id: editingTutorial.id });
        toast({
          title: "Tutorial atualizado",
          description: "O tutorial foi atualizado com sucesso.",
        });
      } else {
        // Criar novo tutorial
        await createTutorial(data);
        toast({
          title: "Tutorial criado",
          description: "O tutorial foi criado com sucesso.",
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar tutorial:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o tutorial.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (tutorialToDelete) {
      setIsLoading(true);
      try {
        await deleteTutorial(tutorialToDelete);
        setTutorialToDelete(null);
        toast({
          title: "Tutorial excluído",
          description: "O tutorial foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir tutorial:", error);
        toast({
          title: "Erro ao excluir",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o tutorial.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando tutoriais...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-destructive">Erro ao carregar tutoriais: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Como Usar</h1>
        
        {currentUser?.role === "admin" && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Conteúdo
          </Button>
        )}
      </div>

      {tutorials.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-background">
          <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum conteúdo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {currentUser?.role === "admin" 
              ? "Você ainda não criou nenhum tutorial." 
              : "Ainda não há conteúdos de tutorial disponíveis."
            }
          </p>
          {currentUser?.role === "admin" && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro tutorial
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {tutorials.map((tutorial, index) => (
            <TutorialCard 
              key={tutorial.id}
              tutorial={tutorial}
              isAdmin={currentUser?.role === "admin"}
              canMoveUp={index > 0}
              canMoveDown={index < tutorials.length - 1}
              onPlay={() => handlePlay(tutorial)}
              onEdit={() => handleEdit(tutorial)}
              onDelete={() => handleDelete(tutorial)}
              onMoveUp={() => handleMoveUp(tutorial.id)}
              onMoveDown={() => handleMoveDown(tutorial.id)}
            />
          ))}
        </div>
      )}

      {/* Modal do vídeo */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={handleCloseVideo}
          title={selectedVideo.title}
          youtubeUrl={selectedVideo.url}
        />
      )}

      {/* Modal de criação/edição */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTutorial ? "Editar Tutorial" : "Novo Tutorial"}
            </DialogTitle>
          </DialogHeader>
          <TutorialForm
            initialData={editingTutorial || undefined}
            isEditing={!!editingTutorial}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={!!tutorialToDelete} onOpenChange={(isOpen) => !isOpen && setTutorialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tutorial? Esta ação não pode ser desfeita.
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