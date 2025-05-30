import { useEffect } from "react";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestUsers() {
  const { 
    users, 
    isLoading, 
    currentPage, 
    totalPages, 
    fetchUsers 
  } = useUsers();

  // Carrega a primeira página ao montar
  useEffect(() => {
    fetchUsers(1);
  }, []);

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Teste do Hook useUsers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <div>Status do Loading: {isLoading ? "Carregando..." : "Pronto"}</div>
            <div>Página Atual: {currentPage}</div>
            <div>Total de Páginas: {totalPages}</div>
          </div>

          {/* Controles de Paginação */}
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchUsers(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Página Anterior
            </Button>
            <Button
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Próxima Página
            </Button>
          </div>

          {/* Lista de Usuários */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Usuários:</h3>
            <pre className="bg-secondary p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 