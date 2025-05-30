import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  youtubeUrl: string;
}

// Função para extrair ID do vídeo do YouTube
const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Função para gerar URL de embed do YouTube
const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    // Parâmetros do YouTube:
    // autoplay=1 - inicia automaticamente
    // rel=0 - não mostra vídeos relacionados no final
    // modestbranding=1 - remove logo do YouTube
    // fs=1 - permite tela cheia
    // iv_load_policy=3 - remove anotações
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1&iv_load_policy=3`;
  }
  return "";
};

export function VideoModal({ isOpen, onClose, title, youtubeUrl }: VideoModalProps) {
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0">
        <DialogHeader className="p-4 md:p-6 pb-2 md:pb-0">
          <DialogTitle className="text-lg md:text-xl pr-8">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 md:p-6 pt-2 md:pt-4">
          {embedUrl ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg">
              <iframe
                src={embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Erro ao carregar o vídeo</p>
                <p className="text-sm text-muted-foreground">Verifique se a URL do YouTube está correta</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 