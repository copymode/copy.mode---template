
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Save, Upload } from "lucide-react";

const ProfileCard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Profile state
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError("O nome não pode estar vazio.");
      return false;
    }
    
    if (name.trim().length < 2) {
      setNameError("O nome deve ter pelo menos 2 caracteres.");
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    // Clear error when user starts typing
    if (nameError) setNameError(null);
  };

  const handleSaveDisplayName = async () => {
    // Validate name before saving
    if (!validateName(displayName)) {
      toast({
        title: "Erro de validação",
        description: nameError,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Use RPC function to update the name
      const { data, error } = await supabase.rpc('update_user_name', {
        name_value: displayName
      });

      if (error) throw error;
      
      toast({
        title: "Nome atualizado",
        description: "Seu nome foi atualizado com sucesso.",
      });

      // Update the local context without forcing a full page reload
      if (currentUser) {
        // Wait a moment before redirecting to ensure toast is visible
        setTimeout(() => {
          // Use window.location.href to ensure a full page reload
          window.location.href = window.location.pathname;
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu nome.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

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
      const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
      
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
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Update local state
      setAvatarUrl(publicUrlData.publicUrl);
      
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {(displayName || currentUser?.name || "U")[0].toUpperCase()}
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
                      <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} />
                    ) : (
                      <AvatarFallback className="text-4xl">
                        {(displayName || currentUser?.name || "U")[0].toUpperCase()}
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
          
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <div className="flex flex-col gap-1">
                <Input
                  id="displayName"
                  placeholder="Seu nome"
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
                <Button
                  variant="outline"
                  onClick={handleSaveDisplayName}
                  disabled={isSaving || !displayName || displayName === currentUser?.name}
                  className="mt-2 self-start"
                >
                  {isSaving ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="p-2 bg-secondary rounded">
                {currentUser?.email || "Não definido"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
