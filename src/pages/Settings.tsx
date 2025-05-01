
import { Card } from "@/components/ui/card";
import ProfileCard from "@/components/settings/ProfileCard";
import PasswordCard from "@/components/settings/PasswordCard";
import ApiKeyCard from "@/components/settings/ApiKeyCard";
import AccountInfoCard from "@/components/settings/AccountInfoCard";

export default function Settings() {
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>
      
      <div className="space-y-6">
        <ProfileCard />
        <PasswordCard />
        <ApiKeyCard />
        <AccountInfoCard />
      </div>
    </div>
  );
}
