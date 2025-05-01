
import { Label } from "@/components/ui/label";

interface EmailDisplayProps {
  email: string;
}

export const EmailDisplay = ({ email }: EmailDisplayProps) => {
  return (
    <div className="space-y-2">
      <Label>Email</Label>
      <div className="p-2 bg-secondary rounded">
        {email || "Não definido"}
      </div>
    </div>
  );
};
