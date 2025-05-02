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

export function ContentTypeAvatarUploaderDebug({
  contentTypeId,
  initialImage,
  onAvatarChange,
}: ContentTypeAvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setAvatarUrl(initialImage || null);
  }, [initialImage]);

  async function checkStorage() {
    try {
      console.log("Verificando bucket de storage...");
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Erro ao listar buckets:", bucketsError);
        setError(`Erro ao listar buckets: ${bucketsError.message}`);
        return false;
      }
      
      const contentTypeBucket = buckets?.find(b => b.id === "content.type.avatars");
      console.log("Bucket encontrado:", contentTypeBucket);
      
      if (!contentTypeBucket) {
        setError("Bucket 'content.type.avatars' não encontrado");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao verificar storage:", error);
      setError(`Erro ao verificar storage: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async function uploadAvatar(file: File) {
    setError(null);
    try {
      setUploading(true);
      console.log("Iniciando upload de avatar...");
      
      if (!file) {
        throw new Error("Arquivo de imagem não fornecido");
      }

      // Prepare unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${contentTypeId || "new"}-${Date.now()}.${fileExt}`;
      const filePath = fileName;
      
      console.log("Preparando para upload:", {
        filename: fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket: "content.type.avatars"
      });

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("content.type.avatars")
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw new Error(`Erro no upload da imagem: ${uploadError.message}`);
      }

      console.log("Upload concluído com sucesso:", data);

      // Create public URL
      const { data: publicUrlData } = supabase.storage
        .from("content.type.avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;
      console.log("URL pública gerada:", avatarUrl);
      
      setAvatarUrl(avatarUrl);
      onAvatarChange(avatarUrl);

      toast({
        title: "Avatar atualizado",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao carregar a imagem.";
      setError(errorMessage);
      toast({
        title: "Erro no upload",
        description: errorMessage,
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
        setError("O tamanho máximo permitido é 2MB.");
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
    setError(null);
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
      
      {error && (
        <div className="text-red-500 text-sm mt-2 max-w-xs text-center">
          Erro: {error}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-1">
        Formatos suportados: JPG, PNG, GIF. Tamanho máximo: 2MB
      </div>
    </div>
  );
} 