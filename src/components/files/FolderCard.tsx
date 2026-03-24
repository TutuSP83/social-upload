
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderOpen, 
  Users, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  CheckCircle,
  Circle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { EditNameModal } from './EditNameModal';
import { EnhancedShareModal } from './EnhancedShareModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useFolders } from '@/hooks/useFolders';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    user_id: string;
    created_at: string;
    file_count?: number;
    folder_count?: number;
  };
  onDelete?: (id: string) => void;
  onNavigate?: (folderId: string) => void;
  onUpdate?: () => void;
  onShare?: (folder: any) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  isSelectionMode?: boolean;
}

export const FolderCard = ({ 
  folder, 
  onDelete, 
  onNavigate, 
  onUpdate, 
  onShare,
  showActions = true,
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false
}: FolderCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { renameFolder } = useFolders();
  const isMobile = useIsMobile();

  const handleNavigate = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(folder.id);
    } else if (onNavigate) {
      onNavigate(folder.id);
    }
  };

  const handleRename = async (newName: string) => {
    const success = await renameFolder(folder.id, newName);
    if (success && onUpdate) {
      onUpdate();
    }
    return success;
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(folder.id);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(folder);
    } else {
      setShowShare(true);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={`group cursor-pointer hover:shadow-md transition-all duration-200 border ${
            isSelected 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-border/50 hover:border-border'
          }`}
          onClick={handleNavigate}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Selection Indicator */}
              {isSelectionMode && (
                <div className="flex-shrink-0 mt-1">
                  {isSelected ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {/* Folder Icon */}
              <div className="flex-shrink-0">
                <div className={`p-2 sm:p-3 rounded-lg ${
                  isSelected 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {isHovered ? (
                    <FolderOpen className="h-4 w-4 sm:h-6 sm:w-6" />
                  ) : (
                    <Folder className="h-4 w-4 sm:h-6 sm:w-6" />
                  )}
                </div>
              </div>

              {/* Folder Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                      {folder.name}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(folder.created_at)}
                      </span>
                    </div>

                    {/* File/Folder count */}
                    {(folder.file_count !== undefined || folder.folder_count !== undefined) && (
                      <div className="flex items-center gap-2 mt-2">
                        {folder.file_count !== undefined && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {folder.file_count} arquivo{folder.file_count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {folder.folder_count !== undefined && folder.folder_count > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {folder.folder_count} pasta{folder.folder_count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {showActions && !isSelectionMode && (
                    <div className="flex items-center" onClick={stopPropagation}>
                      {isMobile ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleShare}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Compartilhar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEdit(true)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setShowDelete(true)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                            className="h-8 w-8 p-0"
                            title="Compartilhar"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEdit(true)}
                            className="h-8 w-8 p-0"
                            title="Renomear"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDelete(true)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <EditNameModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        currentName={folder.name}
        type="folder"
        onSave={handleRename}
      />

      <EnhancedShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        item={folder}
        type="folder"
      />

      <DeleteConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        itemName={folder.name}
        itemType="pasta"
      />
    </>
  );
};
