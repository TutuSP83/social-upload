import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, Archive } from 'lucide-react';
import { isCompressedFile, getArchiveType } from '@/lib/utils';

interface FilePreviewModalProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    user_id?: string; // Para saber de quem é o arquivo
  };
  isOpen: boolean;
  onClose: () => void;
  enableDownload?: boolean;
  isSharedFile?: boolean; // Para identificar se é arquivo recebido
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ 
  file, 
  isOpen, 
  onClose,
  enableDownload = false,
  isSharedFile = false
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDownload = async () => {
    try {
      // Gerar URL assinada otimizada para download (streaming, sem carregar em memória)
      const { data, error } = await supabase.storage
        .from('uploads')
        .createSignedUrl(file.path, 3600, { download: file.name });

      if (error) throw error;

      const downloadUrl = data.signedUrl;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.rel = 'noopener';
      a.target = '_blank';
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('Download iniciado via URL assinada:', file.name);
    } catch (error) {
      console.error('Erro ao gerar link de download:', error);
    }
  };

  const openInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  useEffect(() => {
    const getFileUrl = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setFileUrl(null); // Reset previous URL
      
      try {
        console.log('Preview Modal - File info:', {
          name: file.name,
          path: file.path,
          isSharedFile,
          user_id: file.user_id
        });

        // Para todos os arquivos, tentar acessar pelo path diretamente
        // pois o path já deve incluir o user_id correto
        const { data, error } = await supabase.storage
          .from('uploads')
          .createSignedUrl(file.path, 3600);

        if (error) {
          console.error('Error creating signed URL:', error);
          console.log('Attempted path:', file.path);
          throw error;
        }
        
        console.log('Successfully created signed URL');
        setFileUrl(data.signedUrl);
      } catch (error) {
        console.error('Error getting file URL:', error);
        // Não definir fileUrl manterá o estado de erro
      } finally {
        setLoading(false);
      }
    };

    getFileUrl();
  }, [file.path, isOpen, isSharedFile]);

  const isOfficeFile = () => {
    const officeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint'
    ];
    
    return officeTypes.includes(file.type) || 
           file.name.match(/\.(docx?|xlsx?|pptx?)$/i);
  };

  const getOfficeViewerUrl = (url: string) => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando...</span>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg mb-2">Erro ao carregar o arquivo</p>
          <p className="text-sm">Não foi possível acessar este arquivo para visualização</p>
        </div>
      );
    }

    // Image files
    if (file.type.startsWith('image/')) {
      return (
        <div className="text-center">
          <img 
            src={fileUrl} 
            alt={file.name} 
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            style={{ objectFit: 'contain' }}
          />
          <div className="mt-4 flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      );
    }

    // Video files - Melhor suporte para MP4 e outros formatos
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      return (
        <div className="text-center">
          <video 
            controls 
            className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg bg-black"
            preload="auto"
            playsInline
            style={{ 
              width: '100%',
              maxWidth: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('Erro ao carregar vídeo:', {
                fileName: file.name,
                fileType: file.type,
                src: fileUrl
              });
            }}
          >
            <source src={fileUrl} type="video/mp4" />
            Seu navegador não suporta a reprodução deste vídeo. Tente fazer o download.
          </video>
          <div className="mt-4 flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Se o vídeo não carregar, use o botão de download ou abra em nova aba
          </p>
        </div>
      );
    }

    // Audio files
    if (file.type.startsWith('audio/')) {
      return (
        <div className="text-center">
          <div className="bg-gray-100 p-8 rounded-lg mb-4">
            <audio controls className="w-full">
              <source src={fileUrl} type={file.type} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
          <div className="flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      );
    }

    // PDF files
    if (file.type === 'application/pdf') {
      return (
        <div className="text-center">
          <iframe
            src={fileUrl}
            className="w-full h-96 border rounded-lg"
            title={file.name}
          />
          <div className="mt-4 flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      );
    }

    // Office files
    if (isOfficeFile()) {
      return (
        <div className="text-center">
          <iframe
            src={getOfficeViewerUrl(fileUrl)}
            className="w-full h-96 border rounded-lg"
            title={file.name}
          />
          <div className="mt-4 flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      );
    }

    // Text files
    if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|xml|csv)$/i)) {
      return (
        <div className="text-center">
          <iframe
            src={fileUrl}
            className="w-full h-96 border rounded-lg bg-white"
            title={file.name}
          />
          <div className="mt-4 flex justify-center gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
      );
    }

    // Archive files (ZIP, RAR, etc.)
    if (isCompressedFile(file.name, file.type)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Archive className="h-10 w-10 text-orange-600" />
          </div>
          <p className="text-lg mb-2 font-semibold">Arquivo Compactado</p>
          <p className="text-sm mb-4 text-center">
            Este é um arquivo {getArchiveType(file.name, file.type)}. <br />
            Faça o download para extrair e visualizar o conteúdo.
          </p>
          <div className="flex gap-2">
            {enableDownload && (
              <Button onClick={handleDownload} className="bg-orange-600 hover:bg-orange-700">
                <Download className="h-4 w-4 mr-2" />
                Download {getArchiveType(file.name, file.type)}
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg mb-2">Visualização não disponível</p>
        <p className="text-sm mb-4">Este tipo de arquivo não pode ser visualizado diretamente</p>
        <div className="flex gap-2">
          {enableDownload && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download para visualizar
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
};