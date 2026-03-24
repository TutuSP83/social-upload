
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { RocketAnimation } from '@/components/animations/RocketAnimation';
import { useVideoCompression } from '@/hooks/useVideoCompression';
import { VideoCompressionModal } from '@/components/files/VideoCompressionModal';
import { VideoCompressionProgress } from '@/components/files/VideoCompressionProgress';

interface UploadButtonProps {
  folderId?: string | null;
  onUploadComplete?: () => void;
}

export const UploadButton = ({ folderId, onUploadComplete }: UploadButtonProps) => {
  const { uploadFiles, uploading, showRocketAnimation } = useFileUpload();
  const { compressVideo, compressing, progress, currentFile, estimatedTimeLeft } = useVideoCompression();
  const buttonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivos selecionados:', files.length);
    console.log('Pasta atual:', folderId);

    // Check if there's a large video file
    const videoFile = Array.from(files).find(
      file => file.type.startsWith('video/') && file.size > 50 * 1024 * 1024 // > 50MB
    );

    if (videoFile) {
      setPendingFile(videoFile);
      setPendingFiles(files);
      setShowCompressionModal(true);
      return;
    }

    // No large video, upload directly
    const success = await uploadFiles(files, folderId);
    if (success && onUploadComplete) {
      onUploadComplete();
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleCompress = async (settings: any) => {
    setShowCompressionModal(false);
    
    if (!pendingFile || !pendingFiles) return;

    try {
      // Compress the video
      const compressedFile = await compressVideo(pendingFile, settings);

      // Replace the video file with compressed version
      const filesArray = Array.from(pendingFiles);
      const videoIndex = filesArray.findIndex(f => f === pendingFile);
      filesArray[videoIndex] = compressedFile;

      // Upload com lista de arquivos (compatível com mobile/iOS)
      const success = await uploadFiles(filesArray as any, folderId);
      if (success && onUploadComplete) {
        onUploadComplete();
      }
    } finally {
      setPendingFile(null);
      setPendingFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSkipCompression = async () => {
    setShowCompressionModal(false);
    
    if (!pendingFiles) return;

    const success = await uploadFiles(pendingFiles, folderId);
    if (success && onUploadComplete) {
      onUploadComplete();
    }

    setPendingFile(null);
    setPendingFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getButtonPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  const isDisabled = uploading || compressing;

  return (
    <>
      <div ref={buttonRef} className="relative">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isDisabled}
          multiple
          accept="*/*"
        />
        <Button disabled={isDisabled} className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          {uploading ? 'Enviando...' : compressing ? 'Comprimindo...' : 'Enviar Arquivo'}
        </Button>
      </div>
      
      <RocketAnimation 
        isVisible={showRocketAnimation} 
        onComplete={() => {}}
        position={getButtonPosition()}
      />

      <VideoCompressionModal
        open={showCompressionModal}
        onOpenChange={setShowCompressionModal}
        file={pendingFile}
        onCompress={handleCompress}
        onSkip={handleSkipCompression}
      />

      <VideoCompressionProgress
        visible={compressing}
        progress={progress}
        fileName={currentFile}
        estimatedTimeLeft={estimatedTimeLeft}
      />
    </>
  );
};
