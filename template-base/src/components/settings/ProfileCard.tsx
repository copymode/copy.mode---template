import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AvatarUploader } from "./AvatarUploader";
import { ProfileNameEditor } from "./ProfileNameEditor";
import { EmailDisplay } from "./EmailDisplay";

const ProfileCard = () => {
  const { currentUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser?.avatar_url || null);

  // Atualizar o avatar quando o usuário mudar ou quando a página for carregada
  useEffect(() => {
    if (currentUser?.avatar_url) {
      console.log("Atualizando avatar do perfil para:", currentUser.avatar_url);
      setAvatarUrl(currentUser.avatar_url);
    }
  }, [currentUser]);

  // Handler for when avatar is updated by child component
  const handleAvatarUpdated = (url: string) => {
    console.log("Avatar atualizado para:", url);
    setAvatarUrl(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Profile Information */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
          {currentUser && (
            <AvatarUploader 
              userId={currentUser.id} 
              userName={currentUser.name || ""} 
              avatarUrl={avatarUrl} 
              onAvatarUpdated={handleAvatarUpdated}
            />
          )}
          
          <div className="flex-1 space-y-4 w-full">
            {currentUser && (
              <>
                <ProfileNameEditor 
                  userId={currentUser.id}
                  currentName={currentUser.name || ""}
                />
                
                <EmailDisplay 
                  email={currentUser.email || ""}
                />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
