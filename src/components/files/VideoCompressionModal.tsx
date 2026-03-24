import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { CompressionSettings } from '@/hooks/useVideoCompression';
import { Film, Zap, HardDrive, Monitor, Gauge, Sparkles } from 'lucide-react';

interface VideoCompressionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCompress: (settings: CompressionSettings) => void;
  onSkip: () => void;
}

export const VideoCompressionModal = ({
  open,
  onOpenChange,
  file,
  onCompress,
  onSkip
}: VideoCompressionModalProps) => {
  const [resolution, setResolution] = useState<CompressionSettings['resolution']>('720p');
  const [bitrate, setBitrate] = useState<CompressionSettings['bitrate']>('medium');

  const handleCompress = () => {
    onCompress({ resolution, bitrate });
  };

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Film className="h-6 w-6 text-primary" />
            </div>
            Comprimir Vídeo
          </DialogTitle>
          <DialogDescription className="text-base">
            Otimize seu vídeo para upload mais rápido mantendo a qualidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Info Card */}
          <Card className="border-muted bg-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-background">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">Arquivo de vídeo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{fileSizeMB} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Resolução</Label>
            </div>
            <RadioGroup value={resolution} onValueChange={(v) => setResolution(v as any)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className={`cursor-pointer transition-all hover:border-primary ${resolution === 'original' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setResolution('original')}>
                  <RadioGroupItem value="original" id="res-original" />
                  <div className="flex-1">
                    <Label htmlFor="res-original" className="cursor-pointer font-medium">Original</Label>
                    <p className="text-xs text-muted-foreground">Sem alteração</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all hover:border-primary ${resolution === '1080p' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setResolution('1080p')}>
                  <RadioGroupItem value="1080p" id="res-1080" />
                  <div className="flex-1">
                    <Label htmlFor="res-1080" className="cursor-pointer font-medium">1080p</Label>
                    <p className="text-xs text-muted-foreground">Full HD</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all hover:border-primary ${resolution === '720p' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setResolution('720p')}>
                  <RadioGroupItem value="720p" id="res-720" />
                  <div className="flex-1">
                    <Label htmlFor="res-720" className="cursor-pointer font-medium">720p</Label>
                    <p className="text-xs text-muted-foreground">HD - Recomendado</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all hover:border-primary ${resolution === '480p' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setResolution('480p')}>
                  <RadioGroupItem value="480p" id="res-480" />
                  <div className="flex-1">
                    <Label htmlFor="res-480" className="cursor-pointer font-medium">480p</Label>
                    <p className="text-xs text-muted-foreground">SD</p>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Quality Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Qualidade</Label>
            </div>
            <RadioGroup value={bitrate} onValueChange={(v) => setBitrate(v as any)} className="grid grid-cols-1 gap-3">
              <Card className={`cursor-pointer transition-all hover:border-primary ${bitrate === 'high' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setBitrate('high')}>
                  <RadioGroupItem value="high" id="bit-high" />
                  <div className="flex-1">
                    <Label htmlFor="bit-high" className="cursor-pointer font-medium">Alta Qualidade</Label>
                    <p className="text-xs text-muted-foreground">Melhor qualidade visual, arquivo maior</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all hover:border-primary ${bitrate === 'medium' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setBitrate('medium')}>
                  <RadioGroupItem value="medium" id="bit-medium" />
                  <div className="flex-1">
                    <Label htmlFor="bit-medium" className="cursor-pointer font-medium">Qualidade Média</Label>
                    <p className="text-xs text-muted-foreground">Ótimo equilíbrio - Recomendado</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all hover:border-primary ${bitrate === 'low' ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3" onClick={() => setBitrate('low')}>
                  <RadioGroupItem value="low" id="bit-low" />
                  <div className="flex-1">
                    <Label htmlFor="bit-low" className="cursor-pointer font-medium">Qualidade Básica</Label>
                    <p className="text-xs text-muted-foreground">Arquivo menor, upload mais rápido</p>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onSkip} className="w-full sm:w-auto order-2 sm:order-1">
            Pular Compressão
          </Button>
          <Button onClick={handleCompress} className="w-full sm:w-auto order-1 sm:order-2">
            <Zap className="h-4 w-4 mr-2" />
            Comprimir e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
