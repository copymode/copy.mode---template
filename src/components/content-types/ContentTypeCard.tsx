import { ContentType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { useData } from "@/hooks/useData";
import { useState } from "react";

interface ContentTypeCardProps {
  contentType: ContentType;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContentTypeCard({ contentType, onEdit, onDelete }: ContentTypeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteContentType } = useData();
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteContentType(contentType.id);
      onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {contentType.avatar ? (
                <AvatarImage 
                  src={contentType.avatar} 
                  alt={contentType.name} 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback>
                  {contentType.name[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-lg">{contentType.name}</CardTitle>
          </div>
          
          <div className="flex space-x-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit size={16} />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            
            {onDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete} 
                disabled={isDeleting}
              >
                <Trash size={16} />
                <span className="sr-only">Excluir</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 text-sm text-muted-foreground">
        {contentType.description ? (
          <p>{contentType.description}</p>
        ) : (
          <p className="italic">Sem descrição</p>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        {new Date(contentType.createdAt).toLocaleDateString('pt-BR')}
      </CardFooter>
    </Card>
  );
} 