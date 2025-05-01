
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Upload } from "lucide-react";

interface AvatarUploaderProps {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
}

export const AvatarUploader = ({ userId, userName, avatarUrl, onAvatarUpdated }: AvatarUploaderProps) => {
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const fileExt = file.name.split('.').pop();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!allowedExts.includes(fileExt?.toLowerCase() || '')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem no formato JPG, PNG ou WEBP.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // Generate a unique file path for the user's avatar
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) throw new Error('Failed to get public URL for avatar');

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Notify parent component
      onAvatarUpdated(publicUrlData.publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      
      // Force a refresh of the page after a short delay to ensure the context updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar sua foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <Avatar className="h-24 w-24">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={userName || "Avatar"} />
        ) : (
          <AvatarFallback className="text-2xl">
            {(userName || "U")[0].toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="secondary"
            size="icon"
            className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Mudar foto</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-32 w-32">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={userName || "Avatar"} />
              ) : (
                <AvatarFallback className="text-4xl">
                  {(userName || "U")[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            
            <Button
              onClick={triggerFileInput}
              disabled={isUploadingAvatar}
              className="w-full"
            >
              {isUploadingAvatar ? (
                <>Enviando...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar nova foto
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Formatos permitidos: JPEG, PNG, WebP<br />
              Tamanho máximo: 2MB
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
