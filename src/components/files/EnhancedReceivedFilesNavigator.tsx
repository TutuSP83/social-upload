import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  FolderOpen, 
  File, 
  Users,
  Calendar,
  CheckCircle,
  Circle,
  Eye,
  MoveRight
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import { useEnhancedReceivedFiles } from '@/hooks/useEnhancedReceivedFiles';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import { supabase } from '@/integrations/supabase/client';
import { FilePreviewModal } from './FilePreviewModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

interface EnhancedReceivedFilesNavigatorProps {
  senderFolderId?: string;
  onNavigateBack?: () => void;
  onNavigateToFolder?: (folderId: string) => void;
}

export const EnhancedReceivedFilesNavigator = ({
  senderFolderId,
  onNavigateBack,
  onNavigateToFolder
}: EnhancedReceivedFilesNavigatorProps) => {
  const {
    receivedItems,
    senderFolders,
    loading,
    moveToMyFiles,
    deleteSelectedItems,
    refetch
  } = useEnhancedReceivedFiles(senderFolderId);

  const {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    hasSelection
  } = useMultiSelection();

  const [previewFile, setPreviewFile] = useState<any>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleItemClick = (item: any) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
      return;
    }

    if (item.is_folder) {
      if (!senderFolderId) {
        // Estamos na lista de remetentes → navegar para a raiz do remetente correto
        onNavigateToFolder?.(item.sender_folder_id);
      } else {
        // Já dentro de um remetente → navegar para dentro da pasta
        setCurrentFolderId(item.id);
      }
    } else {
      setPreviewFile(item);
    }
  };

  const handleMoveToMyFiles = async () => {
    const selectedFiles = Array.from(selectedItems).filter(id => {
      const item = displayItems.find(f => f.id === id);
      return item && !item.is_folder;
    });
    
    const selectedFolders = Array.from(selectedItems).filter(id => {
      const item = displayItems.find(f => f.id === id);
      return item && item.is_folder;
    });

    let success = true;
    
    if (selectedFiles.length > 0) {
      success = await moveToMyFiles(selectedFiles, false) && success;
    }
    
    if (selectedFolders.length > 0) {
      success = await moveToMyFiles(selectedFolders, true) && success;
    }

    if (success) {
      clearSelection();
      toggleSelectionMode();
      refetch();
    }
  };

  const handleDeleteSelected = async () => {
    const success = await deleteSelectedItems(Array.from(selectedItems));
    if (success) {
      clearSelection();
      toggleSelectionMode();
    }
  };

  // Helper: constrói caminho da pasta para organizar o ZIP
  const folderPathMap = useMemo(() => {
    const map = new Map<string, { name: string; parent?: string | null }>();
    receivedItems.filter(i => i.is_folder).forEach(f => {
      map.set(f.id, { name: f.name, parent: f.parent_folder_id || null });
    });
    return map;
  }, [receivedItems]);

  const getFolderPath = (folderId: string | null | undefined): string => {
    if (!folderId) return '';
    const parts: string[] = [];
    let current: string | null | undefined = folderId;
    while (current && folderPathMap.has(current)) {
      const entry = folderPathMap.get(current)!;
      parts.unshift(entry.name);
      current = entry.parent ?? null;
    }
    return parts.length ? parts.join('/') + '/' : '';
  };

  const gatherFilesFromFolder = (folderId: string) => {
    const files = receivedItems.filter(i => !i.is_folder && i.folder_id === folderId);
    const subfolders = receivedItems.filter(i => i.is_folder && i.parent_folder_id === folderId);
    let all = [...files];
    for (const sf of subfolders) {
      all = all.concat(gatherFilesFromFolder(sf.id));
    }
    return all;
  };

  const downloadSelected = async () => {
    const ids = Array.from(selectedItems);
    // Expand seleção: incluir arquivos dentro de pastas
    const filesToDownload: any[] = [];
    for (const id of ids) {
      const item = receivedItems.find(i => i.id === id);
      if (!item) continue;
      if (item.is_folder) {
        filesToDownload.push(...gatherFilesFromFolder(item.id));
      } else {
        filesToDownload.push(item);
      }
    }

    if (filesToDownload.length === 1) {
      // Download direto de um arquivo
      const file = filesToDownload[0];
      const { data, error } = await supabase.storage.from('uploads').createSignedUrl(file.path, 3600);
      if (!error && data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    // ZIP múltiplos arquivos
    const zip = new JSZip();
    for (const file of filesToDownload) {
      try {
        const { data, error } = await supabase.storage.from('uploads').createSignedUrl(file.path, 3600);
        if (error || !data?.signedUrl) continue;
        const resp = await fetch(data.signedUrl);
        const blob = await resp.blob();
        const basePath = getFolderPath(file.folder_id);
        zip.file(`${basePath}${file.name}`, blob);
      } catch (e) {
        console.error('Falha ao adicionar ao ZIP:', file.name, e);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arquivos-selecionados.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calcular itens a exibir conforme nível
  const displayItems = useMemo(() => {
    if (!senderFolderId) return senderFolders; // lista de remetentes

    if (!currentFolderId) {
      // raiz do remetente
      const rootFolders = receivedItems.filter(i => i.is_folder && !i.parent_folder_id);
      const rootFiles = receivedItems.filter(i => !i.is_folder && !i.folder_id);
      return [...rootFolders, ...rootFiles];
    }

    const folders = receivedItems.filter(i => i.is_folder && i.parent_folder_id === currentFolderId);
    const files = receivedItems.filter(i => !i.is_folder && i.folder_id === currentFolderId);
    return [...folders, ...files];
  }, [senderFolderId, currentFolderId, receivedItems, senderFolders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(senderFolderId || currentFolderId) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (currentFolderId) {
                  setCurrentFolderId(null);
                } else {
                  onNavigateBack?.();
                }
              }}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">
            {!senderFolderId ? 'Remetentes' : currentFolderId ? 'Arquivos da pasta' : 'Arquivos Recebidos'}
          </h2>
        </div>

        {/* Selection Controls */}
        {senderFolderId && displayItems.length > 0 && (
          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
              >
                Selecionar
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = displayItems.map(item => item.id);
                    allIds.forEach(id => toggleSelection(id));
                  }}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  Limpar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectionMode}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Action Buttons */}
      {isSelectionMode && hasSelection && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedItems.size} item(s) selecionado(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveToMyFiles}
              className="flex items-center gap-2"
            >
              <MoveRight className="h-4 w-4" />
              Mover para Meus Arquivos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {displayItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {senderFolderId ? 'Nenhum arquivo encontrado nesta pasta' : 'Você ainda não recebeu nenhum arquivo'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {displayItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                    selectedItems.has(item.id) 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border/50 hover:border-border'
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Selection Indicator */}
                      {isSelectionMode && (
                        <div className="flex-shrink-0 mt-1">
                          {selectedItems.has(item.id) ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className={`p-3 rounded-lg ${
                          item.is_folder 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {item.is_folder ? (
                            <FolderOpen className="h-6 w-6" />
                          ) : (
                            <File className="h-6 w-6" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {item.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {item.shared_by_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.uploaded_at)}
                          </span>
                        </div>

                        {!item.is_folder && item.size && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(item.size)}
                          </div>
                        )}

                        <div className="mt-2">
                          <Badge 
                            variant={item.permission === 'edit' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.permission === 'edit' ? 'Editar' : 'Visualizar'}
                          </Badge>
                        </div>
                      </div>

                      {/* Preview Button */}
                      {!item.is_folder && !isSelectionMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(item);
                          }}
                          className="h-8 w-8 p-0"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          enableDownload={true}
          isSharedFile={true}
        />
      )}
    </div>
  );
};