
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/data";
import { useAuth } from "@/context/auth";
import { ExpertCard } from "@/components/experts/ExpertCard";
import { ExpertForm } from "@/components/experts/ExpertForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Experts() {
  const { experts, addExpert, updateExpert, deleteExpert } = useData();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);

  const handleAddExpert = (expertData: any) => {
    addExpert(expertData);
    setOpen(false);
  };

  const handleUpdateExpert = (id: string, expertData: any) => {
    updateExpert(id, expertData);
    setSelectedExpert(null);
  };

  const handleDeleteExpert = (id: string) => {
    deleteExpert(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Meus Experts</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Expert
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-2">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {experts
              .filter((expert) => expert.userId === currentUser?.id)
              .map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  onEdit={() => setSelectedExpert(expert)}
                  onDelete={handleDeleteExpert}
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="all" className="space-y-2">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onEdit={() => setSelectedExpert(expert)}
                onDelete={handleDeleteExpert}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ExpertForm
        open={open}
        setOpen={setOpen}
        onSubmit={handleAddExpert}
      />

      {selectedExpert && (
        <ExpertForm
          open={!!selectedExpert}
          setOpen={() => setSelectedExpert(null)}
          expert={selectedExpert}
          onSubmit={(expertData) =>
            handleUpdateExpert(selectedExpert.id, expertData)
          }
        />
      )}
    </div>
  );
}
