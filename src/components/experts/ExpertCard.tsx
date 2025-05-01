import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Save, X } from "lucide-react";
import { useData } from "@/context/data/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Expert } from "@/types";

interface ExpertCardProps {
  expert: Expert;
  onUpdate: (expert: Expert) => void;
  onDelete: (id: string) => void;
}

export function ExpertCard({ expert, onDelete, onUpdate }: ExpertCardProps) {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(expert.name);
  const [niche, setNiche] = useState(expert.niche);
  const [targetAudience, setTargetAudience] = useState(expert.targetAudience);
  const [deliverables, setDeliverables] = useState(expert.deliverables);
  const [benefits, setBenefits] = useState(expert.benefits);
  const [objections, setObjections] = useState(expert.objections);
  const { updateExpert } = useData();

  const handleSave = () => {
    if (!currentUser) return;

    const updatedExpertData: Partial<Expert> = {
      name,
      niche,
      targetAudience,
      deliverables,
      benefits,
      objections
    };

    updateExpert(expert.id, updatedExpertData);
    onUpdate({ ...expert, ...updatedExpertData });
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Editando Expert" : expert.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isEditing ? (
          <>
            <div className="grid gap-2">
              <label htmlFor="name">Nome</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="niche">Nicho</label>
              <Textarea
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="targetAudience">Público Alvo</label>
              <Textarea
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="deliverables">Entregáveis</label>
              <Textarea
                id="deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="benefits">Benefícios</label>
              <Textarea
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="objections">Objeções</label>
              <Textarea
                id="objections"
                value={objections}
                onChange={(e) => setObjections(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <label>Nicho</label>
              <div className="p-2 bg-secondary rounded">{expert.niche || "Não definido"}</div>
            </div>
            <div className="grid gap-2">
              <label>Público Alvo</label>
              <div className="p-2 bg-secondary rounded">{expert.targetAudience || "Não definido"}</div>
            </div>
            <div className="grid gap-2">
              <label>Entregáveis</label>
              <div className="p-2 bg-secondary rounded">{expert.deliverables || "Não definido"}</div>
            </div>
            <div className="grid gap-2">
              <label>Benefícios</label>
              <div className="p-2 bg-secondary rounded">{expert.benefits || "Não definido"}</div>
            </div>
            <div className="grid gap-2">
              <label>Objeções</label>
              <div className="p-2 bg-secondary rounded">{expert.objections || "Não definido"}</div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => onDelete(expert.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
