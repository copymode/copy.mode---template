import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Edit, Trash, Play, ChevronUp, ChevronDown } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string;
  created_at: string;
  is_active: boolean;
}

interface TutorialCardProps {
  tutorial: Tutorial;
  isAdmin?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

// Função para extrair ID do vídeo do YouTube
const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Função para gerar URL da miniatura do YouTube
const getYouTubeThumbnail = (url: string): string => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return "/placeholder-video.jpg"; // fallback
};

export function TutorialCard({ 
  tutorial, 
  isAdmin = false, 
  canMoveUp = true, 
  canMoveDown = true, 
  onPlay, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown 
}: TutorialCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const thumbnailUrl = tutorial.thumbnail_url || getYouTubeThumbnail(tutorial.youtube_url);
  
  return (
    <Card className="w-full">
      {/* Layout mobile: vertical */}
      <div className="block md:hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{tutorial.title}</CardTitle>
            {isAdmin && (
              <div className="flex space-x-1">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                    <Edit size={14} />
                    <span className="sr-only">Editar</span>
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onDelete} 
                    disabled={isDeleting}
                    className="h-8 w-8"
                  >
                    <Trash size={14} />
                    <span className="sr-only">Excluir</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Miniatura do vídeo */}
            <div 
              className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group flex-1"
              onClick={onPlay}
            >
              {!imageError ? (
                <img 
                  src={thumbnailUrl}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Overlay com botão de play */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                  <Play className="h-6 w-6 text-black dark:text-white fill-current" />
                </div>
              </div>
            </div>

            {/* Setas de reordenação - Mobile */}
            {isAdmin && (onMoveUp || onMoveDown) && (
              <div className="flex flex-col gap-1 justify-center">
                {onMoveUp && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    className="h-8 w-8"
                    title="Mover para cima"
                  >
                    <ChevronUp size={14} />
                  </Button>
                )}
                {onMoveDown && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    className="h-8 w-8"
                    title="Mover para baixo"
                  >
                    <ChevronDown size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Descrição */}
          <div className="text-sm text-muted-foreground">
            {tutorial.description}
          </div>
        </CardContent>
      </div>

      {/* Layout desktop: horizontal */}
      <div className="hidden md:flex">
        {/* Miniatura à esquerda */}
        <div className="flex-shrink-0 w-80 p-4">
          <div className="flex gap-2">
            <div 
              className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group flex-1"
              onClick={onPlay}
            >
              {!imageError ? (
                <img 
                  src={thumbnailUrl}
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Overlay com botão de play */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                  <Play className="h-6 w-6 text-black dark:text-white fill-current" />
                </div>
              </div>
            </div>

            {/* Setas de reordenação - Desktop */}
            {isAdmin && (onMoveUp || onMoveDown) && (
              <div className="flex flex-col gap-1 justify-center">
                {onMoveUp && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    className="h-8 w-8"
                    title="Mover para cima"
                  >
                    <ChevronUp size={14} />
                  </Button>
                )}
                {onMoveDown && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    className="h-8 w-8"
                    title="Mover para baixo"
                  >
                    <ChevronDown size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo à direita */}
        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{tutorial.title}</CardTitle>
              {isAdmin && (
                <div className="flex space-x-1">
                  {onEdit && (
                    <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                      <Edit size={14} />
                      <span className="sr-only">Editar</span>
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={onDelete} 
                      disabled={isDeleting}
                      className="h-8 w-8"
                    >
                      <Trash size={14} />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base text-muted-foreground">
              {tutorial.description}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
} 