
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils';
import { 
  MoreVertical, 
  Eye, 
  Download, 
  Share2, 
  Edit2, 
  Trash2,
  Move,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FilePreviewModal } from './FilePreviewModal';

interface FileCardProps {
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
  variant?: 'default' | 'shared-sent' | 'shared-received';
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

export const FileCard: React.FC<FileCardProps> = ({
  file,
  showActions = true,
  variant = 'default',
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false,
  onPreview,
  onDownload,
  onShare,
  onEdit,
  onRename,
  onDelete,
  onMove
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const FileIcon = getFileIcon(file.type || '');

  const handlePreview = () => {
    if (onPreview) {
      onPreview(file);
    } else {
      setShowPreview(true);
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(file);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {isSelectionMode && onToggleSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(file.id)}
                  className="flex-shrink-0"
                />
              )}
              
              <FileIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {file.size && <span>{formatBytes(file.size)}</span>}
                  {file.uploaded_at && (
                    <>
                      <span>•</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </>
                  )}
                  {variant === 'shared-sent' && file.shared_count && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {file.shared_count}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {showActions && (
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      
                      {variant === 'default' && (
                        <>
                          {onShare && (
                            <DropdownMenuItem onClick={() => onShare(file)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Compartilhar
                            </DropdownMenuItem>
                          )}
                          
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(file)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Renomear
                            </DropdownMenuItem>
                          )}
                          
                          {onMove && (
                            <DropdownMenuItem onClick={() => onMove(file)}>
                              <Move className="h-4 w-4 mr-2" />
                              Mover
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(file.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showPreview && file.path && (
        <FilePreviewModal
          file={{
            id: file.id,
            name: file.name,
            type: file.type || '',
            size: file.size || 0,
            path: file.path
          }}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          enableDownload={true}
          isSharedFile={variant === 'shared-received'}
        />
      )}
    </>
  );
};
