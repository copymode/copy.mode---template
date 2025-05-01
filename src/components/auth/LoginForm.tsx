
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu e-mail",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "E-mail ou senha inválidos. Tente admin@copymode.com ou user@example.com",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${user.name}!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!adminEmail) {
      toast({
        title: "Erro",
        description: "Por favor, informe o e-mail do usuário",
        variant: "destructive",
      });
      return;
    }

    setIsPromoting(true);

    try {
      // Buscar o usuário pelo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', adminEmail)
        .single();

      if (profileError || !profileData) {
        throw new Error("Usuário não encontrado");
      }

      // Atualizar o papel para admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profileData.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Sucesso",
        description: `O usuário ${adminEmail} agora é um administrador`,
      });

      setShowAdminDialog(false);
      setAdminEmail("");
    } catch (error) {
      console.error("Erro ao promover usuário:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao promover o usuário para administrador",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <>
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Copy Mode</CardTitle>
          <CardDescription>Entre com seu e-mail para continuar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use admin@copymode.com ou user@example.com para testar
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-4 text-center">
        <Button 
          variant="outline" 
          onClick={() => setShowAdminDialog(true)}
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Promover usuário a administrador
        </Button>
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promover usuário a administrador</DialogTitle>
            <DialogDescription>
              Informe o e-mail do usuário que deseja promover a administrador. 
              O usuário já deve estar cadastrado no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-email">E-mail do usuário</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={isPromoting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handlePromoteToAdmin}
              disabled={isPromoting}
            >
              {isPromoting ? "Processando..." : "Promover a administrador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
