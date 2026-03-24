
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Eye, 
  Download, 
  Share2, 
  Edit, 
  FolderOpen, 
  Trash2 
} from 'lucide-react';

interface MobileActionMenuProps {
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  variant?: 'default' | 'shared-sent' | 'shared-received';
}

export const MobileActionMenu = ({
  onPreview,
  onDownload,
  onShare,
  onEdit,
  onMove,
  onDelete,
  variant = 'default'
}: MobileActionMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50"
        sideOffset={8}
      >
        <DropdownMenuItem 
          onClick={() => handleAction(onPreview)}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation"
        >
          <Eye className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Visualizar</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleAction(onDownload)}
          className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation"
        >
          <Download className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium">Download</span>
        </DropdownMenuItem>
        
        {variant === 'default' && (
          <>
            <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={() => handleAction(onShare)}
              className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation"
            >
              <Share2 className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">Compartilhar</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleAction(onEdit)}
              className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation"
            >
              <Edit className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Renomear</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleAction(onMove)}
              className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation"
            >
              <FolderOpen className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium">Mover</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={() => handleAction(onDelete)}
              className="flex items-center px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer text-red-600 dark:text-red-400 touch-manipulation"
            >
              <Trash2 className="h-5 w-5 mr-3" />
              <span className="text-sm font-medium">Excluir</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
