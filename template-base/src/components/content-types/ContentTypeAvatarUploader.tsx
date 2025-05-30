import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContentTypeAvatarUploaderProps {
  contentTypeId?: string;
  initialImage?: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function ContentTypeAvatarUploader({
  contentTypeId,
  initialImage,
  onAvatarChange,
}: ContentTypeAvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAvatarUrl(initialImage || null);
  }, [initialImage]);

  async function uploadAvatar(file: File) {
    try {
      setUploading(true);

      if (!contentTypeId && !file) {
        throw new Error("ID do tipo de conteúdo ou arquivo de imagem não fornecido");
      }

      // Prepare unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${contentTypeId || "new"}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("content.type.avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw new Error(`Erro no upload da imagem: ${uploadError.message}`);
      }

      // Create public URL
      const { data: publicUrlData } = supabase.storage
        .from("content.type.avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;
      setAvatarUrl(avatarUrl);
      onAvatarChange(avatarUrl);

      toast({
        title: "Avatar atualizado",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Falha ao carregar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 2MB.",
          variant: "destructive",
        });
        return;
      }
      uploadAvatar(file);
    }
  }

  function handleAvatarRemove() {
    setAvatarUrl(null);
    onAvatarChange(null);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        {avatarUrl ? (
          <AvatarImage 
            src={avatarUrl} 
            alt="Avatar" 
            className="object-cover"
          />
        ) : (
          <AvatarFallback className="text-2xl bg-muted">
            CT
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex gap-2">
        <div>
          <Label
            htmlFor="avatar"
            className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="sr-only"
          />
        </div>

        {avatarUrl && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleAvatarRemove}
            disabled={uploading}
            aria-label="Remover avatar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 