
import { Expert } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { edit, trash } from "lucide-react";

interface ExpertCardProps {
  expert: Expert;
  onEdit: (expert: Expert) => void;
  onDelete: (id: string) => void;
}

export function ExpertCard({ expert, onEdit, onDelete }: ExpertCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={expert.avatar} alt={expert.name} />
            <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{expert.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{expert.niche}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onEdit(expert)}
          >
            <edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(expert.id)}
          >
            <trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-medium">Público-alvo</p>
            <p className="text-muted-foreground line-clamp-2">
              {expert.targetAudience || "Não definido"}
            </p>
          </div>
          <div>
            <p className="font-medium">Entregáveis</p>
            <p className="text-muted-foreground line-clamp-2">
              {expert.deliverables || "Não definido"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
