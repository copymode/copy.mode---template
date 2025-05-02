import { useState, useEffect } from "react";
import { useData } from "@/context/DataContext";
import { ContentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentTypeAvatarUploaderDebug } from "./ContentTypeAvatarUploaderDebug";

interface ContentTypeFormProps {
  onCancel: () => void;
  contentTypeToEdit?: ContentType | null;
}

export function ContentTypeForm({ onCancel, contentTypeToEdit }: ContentTypeFormProps) {
  const { createContentType, updateContentType } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (contentTypeToEdit) {
      setFormData({
        name: contentTypeToEdit.name,
        description: contentTypeToEdit.description || "",
      });
      setAvatar(contentTypeToEdit.avatar || null);
    }
  }, [contentTypeToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (avatarUrl: string | null) => {
    setAvatar(avatarUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o tipo de conteúdo.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const contentTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        avatar: avatar,
      };
      
      if (contentTypeToEdit) {
        await updateContentType(contentTypeToEdit.id, contentTypeData);
        toast({
          title: "Tipo de conteúdo atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await createContentType(contentTypeData);
        toast({
          title: "Tipo de conteúdo criado",
          description: "O novo tipo de conteúdo foi criado com sucesso.",
        });
      }
      
      onCancel(); // Fechar formulário após sucesso
    } catch (error) {
      console.error("Erro ao salvar tipo de conteúdo:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>
          {contentTypeToEdit ? "Editar Tipo de Conteúdo" : "Novo Tipo de Conteúdo"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <ContentTypeAvatarUploaderDebug 
              contentTypeId={contentTypeToEdit?.id} 
              initialImage={avatar}
              onAvatarChange={handleAvatarChange} 
            />
            <p className="text-sm text-muted-foreground text-center">
              Imagem do tipo de conteúdo (opcional)
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Stories, Reels, Post de Feed, etc."
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descreva o tipo de conteúdo..."
                rows={4}
                className="resize-y min-h-[100px]"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Descreva o formato e características deste tipo de conteúdo.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} type="button" disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : contentTypeToEdit ? (
              "Atualizar"
            ) : (
              "Criar"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 