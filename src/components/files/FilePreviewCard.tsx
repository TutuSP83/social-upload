import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Image, Video, Music, Archive, MoreVertical, Download, Share, Edit, Trash2, Eye, FolderOpen } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { FilePreviewModal } from './FilePreviewModal';

interface FilePreviewCardProps {
  file: {
    id: string;
    name: string;
    type?: string;
    size?: number;
    uploaded_at?: string;
    path?: string;
    folder_id?: string | null;
    shared_count?: number;
  };
  showActions?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  isSelectionMode?: boolean;
  onPreview?: (file: any) => void;
  onDownload?: (file: any) => void;
  onShare?: (file: any) => void;
  onEdit?: (file: any) => void;
  onRename?: (fileId: string, newName: string) => Promise<boolean>;
  onDelete?: (fileId: string) => void;
  onMove?: (file: any) => void;
}

export const FilePreviewCard = ({
  file,
  showActions = true,
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false,
  onPreview,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onMove
}: FilePreviewCardProps) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const getFileIcon = (type?: string) => {
    if (!type) return FileText;
    
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('compressed') || type.includes('x-zip') || type.includes('x-rar')) return Archive;
    
    return FileText;
  };

  const getFileTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-700';
    
    if (type.startsWith('image/')) return 'bg-green-100 text-green-700';
    if (type.startsWith('video/')) return 'bg-blue-100 text-blue-700';
    if (type.startsWith('audio/')) return 'bg-purple-100 text-purple-700';
    if (type.includes('pdf')) return 'bg-red-100 text-red-700';
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('x-zip') || type.includes('x-rar') || type.includes('tar') || type.includes('7z')) return 'bg-orange-100 text-orange-700';
    
    return 'bg-gray-100 text-gray-700';
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(file);
    } else {
      setShowPreviewModal(true);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    }
  };

  const FileIcon = getFileIcon(file.type);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            {/* Área de preview */}
            <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection?.(file.id)}
                    className="bg-white/90 backdrop-blur-sm"
                  />
                </div>
              )}
              
              {/* Preview do arquivo */}
              {file.type?.startsWith('image/') ? (
                <img
                  src={`https://rqvzvcujofvfvmnqdtaz.supabase.co/storage/v1/object/public/uploads/${file.path}`}
                  alt={file.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={handlePreview}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Ícone fallback */}
              <div className={`flex flex-col items-center justify-center text-gray-500 ${file.type?.startsWith('image/') ? 'hidden' : ''}`}>
                <FileIcon className="h-16 w-16 mb-2" />
                <span className="text-sm font-medium">
                  {file.type?.includes('rar') ? 'RAR' : 
                   file.type?.includes('zip') ? 'ZIP' : 
                   file.type?.includes('7z') ? '7Z' :
                   file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              </div>

              {/* Ações no hover */}
              {showActions && !isSelectionMode && (
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePreview}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Informações do arquivo */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-2 leading-tight" title={file.name}>
                  {file.name}
                </h4>
                {showActions && !isSelectionMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </DropdownMenuItem>
                      {onShare && (
                        <DropdownMenuItem onClick={() => onShare(file)}>
                          <Share className="h-4 w-4 mr-2" />
                          Compartilhar
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(file)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onMove && (
                        <DropdownMenuItem onClick={() => onMove(file)}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Mover
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(file.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${getFileTypeColor(file.type)}`}>
                    {file.type?.includes('rar') ? 'RAR' : 
                     file.type?.includes('zip') ? 'ZIP' : 
                     file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                  {file.size && (
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                </div>
                
                {file.uploaded_at && (
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(file.uploaded_at))} atrás
                  </p>
                )}

                {file.shared_count && file.shared_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Compartilhado {file.shared_count}x
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showPreviewModal && (
        <FilePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          file={{
            ...file,
            type: file.type || '',
            size: file.size || 0,
            path: file.path || ''
          }}
        />
      )}
    </>
  );
};