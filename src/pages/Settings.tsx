import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { currentUser, updateUserApiKey } = useAuth();
  const { toast } = useToast();

  // State for API Key
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // State for Password (placeholders)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load API key on mount
  useEffect(() => {
    if (currentUser?.apiKey) {
      setApiKeyInput(currentUser.apiKey);
    }
  }, [currentUser?.apiKey]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      toast({
        title: 'Chave API Inválida',
        description: 'Por favor, insira uma chave API válida da Groq.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingKey(true);
    try {
      // Simulate async operation if needed, or just update directly
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
      updateUserApiKey(apiKeyInput);
      toast({
        title: 'API Key Salva!',
        description: 'Sua chave API da Groq foi atualizada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a chave API. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSavePassword = async () => {
    // TODO: Implement password change logic with backend
    setIsSavingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    setIsSavingPassword(false);
    toast({
      title: 'Funcionalidade Indisponível',
      description: 'A alteração de senha ainda não foi implementada.',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <CardTitle>Chave API da Groq</CardTitle>
          <CardDescription>
            Insira sua chave API da Groq Cloud para habilitar a geração de copy.
            Você pode obter sua chave em{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline text-primary">
              console.groq.com/keys
            </a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="apiKey">Chave API</Label>
          <div className="relative">
            <Input 
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="pr-10" // Add padding for the icon button
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowApiKey(!showApiKey)}
              type="button" // Prevent form submission if inside a form later
              aria-label={showApiKey ? 'Esconder chave' : 'Mostrar chave'}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveApiKey} disabled={isSavingKey}>
            {isSavingKey ? 'Salvando...' : 'Salvar Chave API'}
          </Button>
        </CardFooter>
      </Card>

      {/* Password Change Card (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Atualize a senha da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled/>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePassword} disabled={isSavingPassword || true}> {/* Disabled for now */}
            {isSavingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
