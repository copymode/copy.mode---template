import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Edit, Trash } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserCardProps {
  user: User;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-0 pt-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{user.name}</CardTitle>
          <div className="flex space-x-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                <Edit size={14} />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDelete} 
                disabled={isDeleting}
                className="h-8 w-8"
              >
                <Trash size={14} />
                <span className="sr-only">Excluir</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{user.email}</span>
          <span className="text-xs bg-secondary px-2 py-1 rounded-full">
            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
} 