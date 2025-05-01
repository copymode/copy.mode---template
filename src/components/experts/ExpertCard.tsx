import { Expert } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, UserCircle } from "lucide-react";

interface ExpertCardProps {
  expert: Expert;
  onEdit: (expert: Expert) => void;
  onDelete: (expertId: string) => void;
}

export function ExpertCard({ expert, onEdit, onDelete }: ExpertCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              {/* Placeholder for Photo */}
              {/* Removed conditional rendering for photoUrl */}
             {/* {expert.photoUrl ? ( 
                <img src={expert.photoUrl} alt={expert.name} className="h-10 w-10 rounded-full object-cover" />
             ) : ( */} 
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <UserCircle size={24} />
                </div>
             {/* )} */} 
              <div>
                <CardTitle className="text-lg leading-tight">{expert.name || "Sem Nome"}</CardTitle>
                <p className="text-sm text-muted-foreground">{expert.niche || "Nicho não definido"}</p>
              </div>
           </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(expert)} aria-label="Editar">
                  <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
              <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => onDelete(expert.id)} 
                 className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" 
                 aria-label="Excluir"
               >
                  <Trash2 className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardHeader>
       {/* Optional: Add more details in CardContent if needed later */}
       {/* <CardContent>
         <p className="text-sm text-muted-foreground">Público: {expert.targetAudience || '-'}</p>
       </CardContent> */}
    </Card>
  );
}
