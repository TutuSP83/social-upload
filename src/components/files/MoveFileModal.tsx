
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

interface FolderWithChildren {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  children?: FolderWithChildren[];
  hasChildren?: boolean;
}

interface MoveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  currentFolderId: string | null;
}

export const MoveFileModal = ({ isOpen, onClose, onMove, currentFolderId }: MoveFileModalProps) => {
  const [folders, setFolders] = useState<FolderWithChildren[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      fetchFoldersHierarchy();
    }
  }, [isOpen, user]);

  const fetchFoldersHierarchy = async () => {
    if (!user) return;

    try {
      const { data, error } = await db
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Organizar pastas em hierarquia
      const folderMap = new Map<string, FolderWithChildren>();
      const rootFolders: FolderWithChildren[] = [];

      // Primeiro, criar um mapa de todas as pastas
      (data || []).forEach(folder => {
        const folderWithChildren: FolderWithChildren = {
          ...folder,
          children: [],
          hasChildren: false
        };
        folderMap.set(folder.id, folderWithChildren);
      });

      // Depois, organizar a hierarquia
      (data || []).forEach(folder => {
        const folderWithChildren = folderMap.get(folder.id)!;
        
        if (folder.parent_folder_id) {
          const parent = folderMap.get(folder.parent_folder_id);
          if (parent) {
            parent.children!.push(folderWithChildren);
            parent.hasChildren = true;
          }
        } else {
          rootFolders.push(folderWithChildren);
        }
      });

      setFolders(rootFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isDisabled = currentFolderId === folder.id;
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
            isSelected ? 'bg-purple-100 dark:bg-purple-900/20' : ''
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          {folder.hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleFolder(folder.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          
          <div
            className="flex items-center gap-2 flex-1"
            onClick={() => !isDisabled && setSelectedFolderId(folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-sm">
              {folder.name}
              {isDisabled && <span className="text-xs text-gray-500 ml-2">(atual)</span>}
            </span>
          </div>
        </div>
        
        {folder.hasChildren && isExpanded && (
          <div className="space-y-1">
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mover para pasta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione a pasta de destino:
          </p>
          
          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-2 space-y-1">
              {/* Opção raiz */}
              <div
                className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                  selectedFolderId === null ? 'bg-purple-100 dark:bg-purple-900/20' : ''
                } ${currentFolderId === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentFolderId !== null && setSelectedFolderId(null)}
              >
                <Home className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  📁 Raiz (sem pasta)
                  {currentFolderId === null && (
                    <span className="text-xs text-gray-500 ml-2">(atual)</span>
                  )}
                </span>
              </div>
              
              {/* Lista de pastas hierárquica */}
              <div className="space-y-1">
                {folders.map(folder => renderFolder(folder))}
              </div>
              
              {folders.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  Nenhuma pasta encontrada
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMove}
            disabled={selectedFolderId === currentFolderId}
          >
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
