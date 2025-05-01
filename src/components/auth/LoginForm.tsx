import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
export function LoginForm() {
  const {
    login
  } = useAuth();
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu e-mail",
        variant: "destructive"
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
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login realizado",
          description: `Bem-vindo, ${user.name}!`
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Copy Mode</CardTitle>
        <CardDescription className="text-center">Entre com seu e-mail para continuar.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
              
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : <>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </>}
          </Button>
        </CardFooter>
      </form>
    </Card>;
}