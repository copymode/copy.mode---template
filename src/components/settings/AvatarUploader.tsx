import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl);
  const { updateUserAvatar } = useAuth();

  // Atualiza apenas a sessão, sem recarregar a página
  const updateSessionQuietly = async (newAvatarUrl: string) => {
    try {
      // Atualizar a sessão atual, sem forçar reload
      await supabase.auth.refreshSession();
      console.log("✅ Sessão atualizada silenciosamente");
    } catch (error) {
      console.error("Erro ao atualizar sessão silenciosamente:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validar o formato do arquivo
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!allowedExts.includes(fileExt || '')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem no formato JPG, PNG ou WEBP.",
        variant: "destructive",
      });
      return;
    }

    // Validar o tamanho do arquivo (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Nome único para o arquivo, usando ID do usuário e timestamp
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      console.log("⚠️ Tentando fazer upload para o bucket 'avatars' com caminho:", filePath);
      
      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log("✅ Upload realizado com sucesso:", uploadData);

      // Obter URL pública para o arquivo
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Não foi possível obter URL pública para o avatar');
      }

      console.log("✅ URL pública obtida:", publicUrlData.publicUrl);

      // Atualizar o perfil do usuário com a nova URL do avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      console.log("✅ Perfil atualizado com sucesso no banco de dados");

      // Atualizar também o objeto auth.user.user_metadata para manter consistência
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrlData.publicUrl }
      });

      if (updateUserError) {
        console.warn("⚠️ Não foi possível atualizar os metadados do usuário:", updateUserError);
      } else {
        console.log("✅ Metadados do usuário atualizados com sucesso");
      }

      // Atualizar estado local para refletir a mudança na UI imediatamente
      setLocalAvatarUrl(publicUrlData.publicUrl);

      // Atualizar o avatar no contexto de autenticação para toda a aplicação
      await updateUserAvatar(publicUrlData.publicUrl);

      // Notificar o componente pai
      onAvatarUpdated(publicUrlData.publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      
      // Fechar o dialog
      setDialogOpen(false);
      
      // Atualizar a sessão silenciosamente, sem recarregar a página
      updateSessionQuietly(publicUrlData.publicUrl);
      
    } catch (error) {
      let errorMessage = "Erro ao atualizar foto de perfil.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("⚠️ Erro detalhado:", error);
        
        // Melhorar as mensagens de erro relacionadas a buckets
        if (errorMessage.includes("bucket") && errorMessage.includes("not found")) {
          errorMessage = "O bucket de armazenamento 'avatars' não foi encontrado. Contate o administrador.";
        } else if (errorMessage.includes("permission") || errorMessage.includes("access")) {
          errorMessage = "Sem permissão para upload de arquivos. Contate o administrador.";
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
        {localAvatarUrl ? (
          <AvatarImage src={localAvatarUrl} alt={userName || "Avatar"} />
        ) : (
          <AvatarFallback className="text-2xl">
            {(userName || "U")[0].toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              {localAvatarUrl ? (
                <AvatarImage src={localAvatarUrl} alt={userName || "Avatar"} />
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
