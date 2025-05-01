
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expert } from "@/types";
import { Edit, Trash } from "lucide-react";

interface ExpertCardProps {
  expert: Expert;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
}

export function ExpertCard({ expert, onEdit, onDelete }: ExpertCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{expert.name}</span>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(expert.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>{expert.niche}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <strong>Público-alvo:</strong> {expert.targetAudience}
        </div>
        <div>
          <strong>Entregáveis:</strong> {expert.deliverables}
        </div>
        <div>
          <strong>Benefícios:</strong> {expert.benefits}
        </div>
        <div>
          <strong>Objeções:</strong> {expert.objections}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Criado em {new Date(expert.createdAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}
