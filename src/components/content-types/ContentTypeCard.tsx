import { ContentType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface ContentTypeCardProps {
  contentType: ContentType;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContentTypeCard({ contentType, onEdit, onDelete }: ContentTypeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-14 w-14">
          {contentType.avatar ? (
            <AvatarImage src={contentType.avatar} alt={contentType.name} className="object-cover" />
          ) : (
            <AvatarFallback className="text-xl">
              {contentType.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <CardTitle>{contentType.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Criado {formatRelativeDate(contentType.createdAt)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        {contentType.description ? (
          <p className="text-sm">{contentType.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem descrição</p>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
} 