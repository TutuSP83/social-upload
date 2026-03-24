
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, FolderOpen, X } from 'lucide-react';
import { FileItem } from '@/hooks/useFiles';

interface BulkActionsBarProps {
  selectedFiles: FileItem[];
  onMoveSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedFiles,
  onMoveSelected,
  onDeleteSelected,
  onClearSelection
}: BulkActionsBarProps) => {
  if (selectedFiles.length === 0) return null;

  return (
    <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 p-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedFiles.length} arquivo(s) selecionado(s)
        </span>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveSelected}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Mover
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-1 p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
