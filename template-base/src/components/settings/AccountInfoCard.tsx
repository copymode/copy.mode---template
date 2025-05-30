
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const AccountInfoCard = () => {
  const { currentUser } = useAuth();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Informações da Conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Conta</Label>
          <div className="p-2 bg-secondary rounded capitalize">
            {currentUser?.role || "Usuário"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfoCard;
