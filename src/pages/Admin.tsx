
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/data";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentForm } from "@/components/agents/AgentForm";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Admin() {
  const { agents, createAgent } = useData();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-3xl font-bold">Gerenciar Agentes</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Agente
        </Button>
      </div>

      <AgentForm open={open} setOpen={setOpen} onSubmit={createAgent} />

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Agentes Ativos</TabsTrigger>
          <TabsTrigger value="archived">Agentes Arquivados</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="archived">
          Nenhum agente arquivado encontrado.
        </TabsContent>
      </Tabs>
    </div>
  );
}
