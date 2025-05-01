import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Save, User, Upload, Key, Image, Pencil, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Settings() {
  const { currentUser, updateUserApiKey } = useAuth();
  const { toast } = useToast();
  
  // API Key state
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  useEffect(() => {
    if (currentUser?.apiKey) {
      setApiKey(currentUser.apiKey);
    } else {
      setApiKey("");
    }
    
    if (currentUser?.name) {
      setDisplayName(currentUser.name);
    }
    
    if (currentUser?.avatar_url) {
      setAvatarUrl(currentUser.avatar_url);
    }
  }, [currentUser]);
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const handleSaveApiKey = async () => {
    if (apiKey) {
      try {
        setIsSaving(true);
        await updateUserApiKey(apiKey);
        toast({
          title: "Chave API salva",
          description: "Sua chave API Groq foi salva com sucesso.",
        });
      } catch (error) {
        console.error("Error saving API key:", error);
        toast({
          title: "Erro ao salvar",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar sua chave API.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave API válida.",
        variant: "destructive",
      });
    }
  };
  
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Erro",
        description: "O nome não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Use RPC function instead of direct update to avoid potential RLS issues
      const { error } = await supabase.rpc('update_user_name', {
        name_value: displayName
      });

      if (error) throw error;

      toast({
        title: "Nome atualizado",
        description: "Seu nome foi atualizado com sucesso.",
      });

      // Force a refresh of the page after a short delay to ensure the context updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (!currentPassword) {
      toast({
        title: "Erro",
        description: "Por favor, informe sua senha atual.",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar sua senha.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>
      
      <div className="space-y-6">
        {/* Profile Card */}
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
                  <div className="flex">
                    <Input
                      id="displayName"
                      placeholder="Seu nome"
                      value={displayName}
                      onChange={handleDisplayNameChange}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveDisplayName}
                      disabled={isSaving || !displayName}
                      className="ml-2"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
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
        
        {/* Password Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="flex">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={toggleShowPassword}
                  className="ml-2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              <Key className="mr-2 h-4 w-4" />
              {isChangingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* API Key Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Chave API Groq</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Informação Importante</AlertTitle>
              <AlertDescription>
                Para usar o Copy Mode, você precisa fornecer sua própria chave API da Groq.
                Obtenha uma chave em <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com/keys</a>.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave API Groq</Label>
              <div className="flex">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="gsk_xxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={toggleShowApiKey}
                  className="ml-2"
                >
                  {showApiKey ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveApiKey} 
              disabled={!apiKey || isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Chave API"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <div className="p-2 bg-secondary rounded capitalize">
                {currentUser?.role || "Usuário"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
