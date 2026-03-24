import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Film, Loader2, Zap, Clock } from 'lucide-react';

interface VideoCompressionProgressProps {
  visible: boolean;
  progress: number;
  fileName: string;
  estimatedTimeLeft: number;
}

export const VideoCompressionProgress = ({
  visible,
  progress,
  fileName,
  estimatedTimeLeft
}: VideoCompressionProgressProps) => {
  if (!visible) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 animate-in fade-in zoom-in duration-300">
        <CardContent className="pt-6 pb-6">
          <div className="space-y-6">
            {/* Header with Icon */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary/20">
                  <Film className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary">
                  <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-bold text-lg mb-1">Comprimindo vídeo</h3>
                <p className="text-sm text-muted-foreground truncate">{fileName}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                {estimatedTimeLeft > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {formatTime(estimatedTimeLeft)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            <div className="pt-2 border-t">
              {progress < 10 && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  🚀 Inicializando compressão ultra-rápida...
                </p>
              )}
              {progress >= 10 && progress < 50 && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  ⚡ Processando em velocidade máxima...
                </p>
              )}
              {progress >= 50 && progress < 90 && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  ✨ Quase pronto, finalizando...
                </p>
              )}
              {progress >= 90 && (
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  🎉 Últimos ajustes...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
