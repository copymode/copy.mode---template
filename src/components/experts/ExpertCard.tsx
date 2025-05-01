
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expert } from "@/types";
import { useData } from "@/context/DataContext";
import { useState } from "react";
import { Edit, Trash } from "lucide-react"; // Fixed import (capitalized)

interface ExpertCardProps {
  expert: Expert;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpertCard({ expert, onEdit, onDelete }: ExpertCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteExpert } = useData();
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteExpert(expert.id);
      onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{expert.name}</CardTitle>
          <div className="flex space-x-1">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit size={16} /> {/* Fixed component name (capitalized) */}
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
                <Trash size={16} /> {/* Fixed component name (capitalized) */}
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-2 text-sm">
        <div>
          <span className="font-medium">Nicho:</span> {expert.niche}
        </div>
        <div>
          <span className="font-medium">Público-alvo:</span> {expert.targetAudience}
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        {new Date(expert.createdAt).toLocaleDateString('pt-BR')}
      </CardFooter>
    </Card>
  );
}
