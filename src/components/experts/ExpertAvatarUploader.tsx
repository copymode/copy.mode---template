import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Upload } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface ExpertAvatarUploaderProps {
  expertId?: string;
  expertName: string;
  avatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
  size?: "sm" | "md" | "lg"; // Tamanho do avatar
}

export const ExpertAvatarUploader = ({ 
  expertId, 
  expertName, 
  avatarUrl, 
  onAvatarUpdated,
  size = "md" 
}: ExpertAvatarUploaderProps) => {
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  // Verificar autenticação e buckets no carregamento
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar autenticação
        const { data: user, error: authError } = await supabase.auth.getUser();
        console.log("⚠️ [Avatar] Estado de autenticação:", user ? "Autenticado" : "Não autenticado", authError);
        
        // Verificar buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        console.log("⚠️ [Avatar] Buckets disponíveis:", 
          bucketsError ? `Erro: ${bucketsError.message}` : 
          buckets?.map(b => b.name).join(", "));

        setDiagnosticInfo({
          isAuthenticated: !!user,
          authError: authError?.message,
          buckets: buckets?.map(b => b.name),
          bucketsError: bucketsError?.message
        });
      } catch (err) {
        console.error("⚠️ [Avatar] Erro ao verificar ambiente:", err);
      }
    };
    
    checkAuth();
  }, []);

  // Mapear tamanhos para classes CSS
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("===== DIAGNÓSTICO DE UPLOAD =====");
    console.log("1. Iniciando upload de avatar:", { file, expertId });
    
    // Verificar buckets disponíveis
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log("2. Buckets disponíveis:", buckets);
    } catch (err) {
      console.error("2. ERRO AO LISTAR BUCKETS:", err);
    }
    
    // Verificar se o usuário está autenticado
    const { data: user } = await supabase.auth.getUser();
    console.log("3. Usuário autenticado:", user);

    // Validar formato do arquivo
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

    // Validar tamanho do arquivo (máx 2MB)
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
      
      // Gerar um ID temporário se ainda não tiver um expertId
      const id = expertId || `temp-${uuidv4()}`;
      
      // Gerar um caminho único para o avatar do expert
      const filePath = `${id}/${Date.now()}-${file.name}`;
      console.log("4. Tentando upload para bucket 'expert-avatars', caminho:", filePath);
      
      // TESTE 1: Upload com abordagem direta
      console.log("5. TESTE 1: Upload com abordagem padrão");
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from('expert-avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });
          
        if (uploadResult.error) {
          console.error("TESTE 1 FALHOU:", uploadResult.error);
          throw uploadResult.error;
        } else {
          console.log("TESTE 1 BEM-SUCEDIDO:", uploadResult.data);
        }
      } catch (error1) {
        console.error("ERRO NO TESTE 1:", error1);
        
        // TESTE 2: Tentar com opções diferentes
        console.log("6. TESTE 2: Tentando com configurações alternativas");
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          console.log("Sessão atual:", sessionData ? "Presente" : "Ausente");
          
          uploadResult = await supabase.storage
            .from('expert-avatars')
            .upload(filePath, file, {
              contentType: `image/${fileExt}`,
              duplex: 'half',
              upsert: true
            });
            
          if (uploadResult.error) {
            console.error("TESTE 2 FALHOU:", uploadResult.error);
            throw uploadResult.error;
          } else {
            console.log("TESTE 2 BEM-SUCEDIDO:", uploadResult.data);
          }
        } catch (error2) {
          console.error("ERRO NO TESTE 2:", error2);
          
          // TESTE 3: Tentar com bucket alternativo
          console.log("7. TESTE 3: Tentando com bucket alternativo (avatars)");
          try {
            uploadResult = await supabase.storage
              .from('avatars')  // bucket alternativo que já existe
              .upload(`experts/${id}/${Date.now()}-${file.name}`, file, {
                upsert: true,
              });
              
            if (uploadResult.error) {
              console.error("TESTE 3 FALHOU:", uploadResult.error);
              throw uploadResult.error;
            } else {
              console.log("TESTE 3 BEM-SUCEDIDO:", uploadResult.data);
              
              // Se estamos usando o bucket alternativo, precisamos ajustar a lógica
              // de obtenção de URL para funcionar corretamente
              console.log("8. Obtendo URL pública do bucket alternativo");
              const alternativeBucket = 'avatars';
              const { data: publicUrlData } = supabase.storage
                .from(alternativeBucket)
                .getPublicUrl(uploadResult.data.path);
                
              console.log("9. URL pública do bucket alternativo:", publicUrlData);
              
              if (!publicUrlData.publicUrl) throw new Error('Falha ao obter URL pública para o avatar');
              
              // Notificar componente pai com a URL correta
              console.log("10. Notificando componente pai com URL:", publicUrlData.publicUrl);
              onAvatarUpdated(publicUrlData.publicUrl);
              
              toast({
                title: "Foto atualizada",
                description: "A foto do expert foi atualizada com sucesso.",
              });
              console.log("11. Upload concluído com sucesso!");
              
              // Encerrar aqui se o TESTE 3 funcionou
              setIsUploadingAvatar(false);
              return;
            }
          } catch (error3) {
            console.error("TODOS OS TESTES FALHARAM:", { error1, error2, error3 });
            throw error3;
          }
        }
      }

      if (!uploadResult || !uploadResult.data) {
        throw new Error("Falha no upload: nenhum dado retornado");
      }

      // Obter URL pública para o arquivo
      console.log("8. Tentando obter URL pública");
      const bucketName = uploadResult.data.fullPath ? uploadResult.data.fullPath.split('/')[0] : 'expert-avatars';
      console.log("Bucket usado para URL pública:", bucketName);
      
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadResult.data.path || filePath);

      console.log("9. URL pública obtida:", publicUrlData);

      if (!publicUrlData.publicUrl) throw new Error('Falha ao obter URL pública para o avatar');

      // Notificar componente pai
      console.log("10. Notificando componente pai com URL:", publicUrlData.publicUrl);
      onAvatarUpdated(publicUrlData.publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "A foto do expert foi atualizada com sucesso.",
      });
      console.log("11. Upload concluído com sucesso!");
    } catch (error) {
      console.error("ERRO AO FAZER UPLOAD DO AVATAR:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a foto do expert.",
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
      <Avatar className={sizeClasses[size]}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={expertName || "Avatar"} />
        ) : (
          <AvatarFallback className="text-2xl">
            {(expertName || "E")[0].toUpperCase()}
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
            <DialogTitle>Atualizar foto do expert</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-32 w-32">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={expertName || "Avatar"} />
              ) : (
                <AvatarFallback className="text-4xl">
                  {(expertName || "E")[0].toUpperCase()}
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
            
            {diagnosticInfo && (
              <div className="mt-4 p-2 bg-slate-100 rounded text-xs w-full">
                <details>
                  <summary className="cursor-pointer text-slate-700">Informações de diagnóstico</summary>
                  <div className="mt-2 text-slate-600">
                    <p>Autenticado: {diagnosticInfo.isAuthenticated ? 'Sim' : 'Não'}</p>
                    {diagnosticInfo.authError && <p>Erro de auth: {diagnosticInfo.authError}</p>}
                    <p>Buckets: {diagnosticInfo.buckets?.join(', ') || 'Nenhum'}</p>
                    {diagnosticInfo.bucketsError && <p>Erro de buckets: {diagnosticInfo.bucketsError}</p>}
                  </div>
                </details>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 