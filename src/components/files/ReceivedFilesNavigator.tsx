
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useReceivedFiles } from '@/hooks/useReceivedFiles';
import { FileCard } from './FileCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Folder, 
  Trash2, 
  Download,
  Eye,
  MoreVertical,
  Inbox,
  FolderInput,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const ReceivedFilesNavigator = () => {
  const [currentSenderFolderId, setCurrentSenderFolderId] = useState<string | null>(null);
  const { receivedFiles, senderFolders, loading, refetch, moveToMyFiles, deleteSelectedReceivedFiles } = useReceivedFiles(currentSenderFolderId);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Estado de seleção simples sem usar useMultiSelection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = (id: string) => {
    console.log('DEBUG: Toggle selection chamado para:', id, 'Current selection:', Array.from(selectedItems));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        console.log('DEBUG: Item removido da seleção:', id);
      } else {
        newSet.add(id);
        console.log('DEBUG: Item adicionado à seleção:', id);
      }
      console.log('DEBUG: Nova seleção:', Array.from(newSet));
      return newSet;
    });
  };

  const selectAll = () => {
    const allIds = receivedFiles.map(file => file.id);
    setSelectedItems(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  const hasSelection = selectedItems.size > 0;

  const handleDeleteSelected = async () => {
    if (!hasSelection || !user) {
      console.log('DEBUG: Sem seleção ou usuário não logado:', { hasSelection, user: !!user });
      return;
    }

    console.log('DEBUG: Iniciando exclusão. Items selecionados:', Array.from(selectedItems));
    console.log('DEBUG: Arquivos recebidos disponíveis:', receivedFiles.map(f => ({ id: f.id, name: f.name, is_folder: f.is_folder })));

    // Usar IDs dos itens selecionados diretamente (estes são os IDs dos files/folders originais)
    const selectedFileIds = Array.from(selectedItems).filter(id => {
      const item = receivedFiles.find(f => f.id === id);
      return item && !item.is_folder;
    });
    
    const selectedFolderIds = Array.from(selectedItems).filter(id => {
      const item = receivedFiles.find(f => f.id === id);
      return item && item.is_folder;
    });

    console.log('DEBUG: IDs dos arquivos selecionados:', selectedFileIds);
    console.log('DEBUG: IDs das pastas selecionadas:', selectedFolderIds);

    if (selectedFileIds.length === 0 && selectedFolderIds.length === 0) {
      console.log('DEBUG: Nenhum item válido para deletar');
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione itens válidos para excluir",
        variant: "destructive"
      });
      return;
    }

    const success = await deleteSelectedReceivedFiles(selectedFileIds, selectedFolderIds);
    
    if (success) {
      clearSelection();
    }
  };

  const handleMoveToMyFiles = async () => {
    if (!hasSelection) return;

    const files = receivedFiles.filter(f => selectedItems.has(f.id) && !f.is_folder);
    const folders = receivedFiles.filter(f => selectedItems.has(f.id) && f.is_folder);

    let success = true;

    // Mover arquivos
    if (files.length > 0) {
      const fileIds = files.map(f => f.id);
      const result = await moveToMyFiles(fileIds, false);
      if (!result) success = false;
    }

    // Mover pastas
    if (folders.length > 0) {
      const folderIds = folders.map(f => f.id);
      const result = await moveToMyFiles(folderIds, true);
      if (!result) success = false;
    }

    if (success) {
      clearSelection();
    }
  };

  const handleFolderClick = (senderId: string) => {
    console.log('Clicando na pasta do remetente:', senderId);
    setCurrentSenderFolderId(senderId);
    clearSelection();
  };

  const handleBackToSenders = () => {
    setCurrentSenderFolderId(null);
    clearSelection();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Carregando arquivos recebidos...</span>
      </div>
    );
  }

  // Visualização das pastas de remetentes
  if (!currentSenderFolderId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Arquivos por Remetente
          </h2>
        </div>

        {senderFolders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Inbox className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
              <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                Nenhum arquivo recebido
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                Arquivos compartilhados com você aparecerão aqui organizados por remetente
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {senderFolders.map((folder) => (
              <Card 
                key={folder.id}
                className="hover:shadow-md transition-shadow relative"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div 
                      className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer"
                      onClick={() => handleFolderClick(folder.shared_by)}
                    >
                      <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {folder.shared_by_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {folder.file_count} arquivo(s) • {folder.folder_count} pasta(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {folder.file_count + folder.folder_count} itens
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Visualização dos arquivos dentro de uma pasta de remetente
  const currentFolder = senderFolders.find(f => f.shared_by === currentSenderFolderId);
  const shouldShowMultiSelect = receivedFiles.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0 px-1">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleBackToSenders}
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Voltar
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {currentFolder?.shared_by_name || 'Pasta Desconhecida'}
          </h2>
        </div>

        {shouldShowMultiSelect && (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {isSelectionMode && (
              <>
                <Button
                  onClick={selectAll}
                  variant="outline"
                  size={isMobile ? "sm" : "sm"}
                  className="text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Selecionar Todos
                </Button>
                {hasSelection && (
                  <>
                    <Button
                      onClick={handleMoveToMyFiles}
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                      Mover ({selectedItems.size})
                    </Button>
                    <Button
                      onClick={handleDeleteSelected}
                      variant="destructive"
                      size={isMobile ? "sm" : "sm"}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Remover ({selectedItems.size})
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              onClick={toggleSelectionMode}
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              className="text-xs sm:text-sm flex-1 sm:flex-none"
            >
              {isSelectionMode ? 'Cancelar' : 'Selecionar'}
            </Button>
          </div>
        )}
      </div>

      {receivedFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Folder className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              Pasta vazia
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
              Esta pasta não contém arquivos compartilhados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {receivedFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(file.id)}
                    onCheckedChange={() => toggleSelection(file.id)}
                    className="bg-white border-2"
                  />
                </div>
              )}
              
              {file.is_folder ? (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {file.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          Pasta compartilhada por {file.shared_by_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        Pasta
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <FileCard
                  file={{
                    ...file,
                    folder_id: file.folder_id || null
                  }}
                  showActions={true}
                  variant="shared-received"
                  isSelected={selectedItems.has(file.id)}
                  onToggleSelection={toggleSelection}
                  isSelectionMode={isSelectionMode}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
