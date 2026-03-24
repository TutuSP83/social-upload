import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, FolderPlus, ArrowLeft, Home, Trash2, CheckSquare, Square, Download } from 'lucide-react';
import { FileCard } from './FileCard';
import { FilePreviewCard } from './FilePreviewCard';
import { FolderCard } from './FolderCard';
import { UploadButton } from './UploadButton';
import { NewFolderModal } from './NewFolderModal';
import { FolderBreadcrumb } from './FolderBreadcrumb';
import { EmptyState } from './EmptyState';
import { SpecialFolderCard } from './SpecialFolderCard';
import { EnhancedSharedFilesManager } from './EnhancedSharedFilesManager';
import { BulkActionsBar } from './BulkActionsBar';
import { BulkMoveModal } from './BulkMoveModal';
import { MoveFileModal } from './MoveFileModal';
import { DownloadFormatModal } from './DownloadFormatModal';
import { DownloadAnimation } from '@/components/animations/DownloadAnimation';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';
import { useFiles, FileItem } from '@/hooks/useFiles';
import { useFolders, Folder } from '@/hooks/useFolders';
import { useSpecialFolders } from '@/hooks/useSpecialFolders';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import { EnhancedShareModal } from './EnhancedShareModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

interface FileManagerProps {
  currentFolderId?: string | null;
  onNavigateToFolder?: (folderId: string | null, isSpecial?: boolean, specialType?: 'received' | 'sent') => void;
  folderPath?: Array<{ id: string | null; name: string }>;
}

export const FileManager = ({ 
  currentFolderId = null, 
  onNavigateToFolder = () => {}, 
  folderPath = [{ id: null, name: 'Início' }]
}: FileManagerProps) => {
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadAnimation, setShowDownloadAnimation] = useState(false);
  const [showMoveFileModal, setShowMoveFileModal] = useState(false);
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    item: any;
    type: 'file' | 'folder';
  }>({
    isOpen: false,
    item: null,
    type: 'file'
  });

  const { files, loading: filesLoading, deleteFile, renameFile, moveFile, refetch: refetchFiles } = useFiles(currentFolderId);
  const { folders, loading: foldersLoading, createFolder, deleteFolder, renameFolder, refetch: refetchFolders } = useFolders(currentFolderId);
  const { specialFolders } = useSpecialFolders();

  // Use multi-selection hook
  const {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    hasSelection,
    getSelectedFiles,
    getSelectedFolders
  } = useMultiSelection();

  const loading = filesLoading || foldersLoading;

  // Verificar se estamos em uma pasta especial
  const isSpecialFolder = currentFolderId?.startsWith('special-');
  const specialType = currentFolderId === 'special-received' ? 'received' : 
                     currentFolderId === 'special-sent' ? 'sent' : null;

  const handleCreateFolder = async (name: string) => {
    const success = await createFolder(name);
    if (success) {
      setShowNewFolderModal(false);
    }
    return success;
  };

  const handleDeleteFile = async (fileId: string) => {
    await deleteFile(fileId);
    clearSelection();
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    return await renameFolder(folderId, newName);
  };

  const handleDeleteSelected = async () => {
    if (!hasSelection) return;

    try {
      const selectedFiles = getSelectedFiles(files);
      const fileDeletePromises = selectedFiles.map(file => deleteFile(file.id));
      
      await Promise.all(fileDeletePromises);
      
      toast({
        title: "Arquivos excluídos",
        description: `${selectedFiles.length} arquivo(s) excluído(s) com sucesso`
      });
      
      clearSelection();
    } catch (error) {
      console.error('Erro ao excluir arquivos:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir alguns arquivos",
        variant: "destructive"
      });
    }
  };

  const handleBulkMove = async (fileIds: string[], targetFolderId: string | null) => {
    try {
      const movePromises = fileIds.map(fileId => moveFile(fileId, targetFolderId));
      await Promise.all(movePromises);
      
      toast({
        title: "Arquivos movidos",
        description: `${fileIds.length} arquivo(s) movido(s) com sucesso`
      });
      
      clearSelection();
    } catch (error) {
      console.error('Erro ao mover arquivos:', error);
      toast({
        title: "Erro ao mover",
        description: "Não foi possível mover alguns arquivos",
        variant: "destructive"
      });
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    return await renameFile(fileId, newName);
  };

  const handleMoveFile = async (fileId: string, targetFolderId: string | null) => {
    return await moveFile(fileId, targetFolderId);
  };

  const handleUploadComplete = useCallback(() => {
    refetchFiles();
  }, [refetchFiles]);

  const handleFolderUpdate = useCallback(() => {
    refetchFolders();
  }, [refetchFolders]);

  const handleBackNavigation = () => {
    if (folderPath.length > 1) {
      const parentFolder = folderPath[folderPath.length - 2];
      onNavigateToFolder(parentFolder.id);
    } else {
      onNavigateToFolder(null);
    }
  };

  const handleHomeNavigation = () => {
    onNavigateToFolder(null);
  };

  const handleShareFile = (file: FileItem) => {
    setShareModal({
      isOpen: true,
      item: file,
      type: 'file'
    });
  };

  const handleShareFolder = (folder: Folder) => {
    setShareModal({
      isOpen: true,
      item: folder,
      type: 'folder'
    });
  };

  const handleDownloadFile = async (file: FileItem) => {
    console.log('🔽 INICIANDO DOWNLOAD - Informações do arquivo:', {
      id: file.id,
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size
    });

    if (!file.path) {
      console.error('❌ ERRO: Caminho do arquivo não encontrado');
      toast({
        title: "Erro no download",
        description: "Caminho do arquivo não encontrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔄 Tentando download direto do Supabase Storage...');
      console.log('📍 Bucket: uploads');
      console.log('📁 Path:', file.path);
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.path);

      if (error) {
        console.error('❌ ERRO no download do storage:', {
          error,
          message: error.message,
          name: error.name
        });
        
        // Tentar com URL pública se o bucket for público
        console.log('🔄 Tentando URL pública como alternativa...');
        const publicUrl = `https://rqvzvcujofvfvmnqdtaz.supabase.co/storage/v1/object/public/uploads/${file.path}`;
        console.log('🌐 URL pública:', publicUrl);
        
        try {
          const response = await fetch(publicUrl);
          console.log('📡 Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('📦 Blob criado, tamanho:', blob.size);
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.style.display = 'none';
          document.body.appendChild(link);
          
          console.log('🎯 Executando download...');
          link.click();
          
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log('✅ Download concluído via URL pública');
          toast({
            title: "Download concluído",
            description: `${file.name} baixado com sucesso.`
          });
          return;
        } catch (publicError) {
          console.error('❌ Falha na URL pública também:', publicError);
        }
        
        toast({
          title: "Erro no download",
          description: `Não foi possível baixar o arquivo: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Download do storage bem-sucedido');
      console.log('📦 Dados recebidos, tamanho:', data?.size || 'desconhecido');

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('🎯 Executando download...');
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Download concluído com sucesso!');
      toast({
        title: "Download concluído",
        description: `${file.name} baixado com sucesso.`
      });
    } catch (error) {
      console.error('❌ ERRO GERAL no download:', {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Erro no download",
        description: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  const handleSelectedDownloadZip = async () => {
    setShowDownloadModal(false);
    
    const selectedFiles = getSelectedFiles(files);
    const selectedFolders = getSelectedFolders(folders);
    
    if (selectedFiles.length === 0 && selectedFolders.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione arquivos ou pastas para download.",
        variant: "destructive"
      });
      return;
    }

    // Mostrar animação de download
    setShowDownloadAnimation(true);

    // Função para buscar arquivos dentro de uma pasta recursivamente
    const getFilesFromFolder = async (folderId: string): Promise<FileItem[]> => {
      try {
        const { data: folderFiles, error } = await db
          .from('files')
          .select('*')
          .eq('folder_id', folderId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          console.error('Erro ao buscar arquivos da pasta:', error);
          return [];
        }

        return folderFiles || [];
      } catch (error) {
        console.error('Erro ao buscar arquivos da pasta:', error);
        return [];
      }
    };

    // Coletar todos os arquivos das pastas selecionadas
    let allFilesToDownload = [...selectedFiles];
    
    for (const folder of selectedFolders) {
      const folderFiles = await getFilesFromFolder(folder.id);
      allFilesToDownload = [...allFilesToDownload, ...folderFiles];
    }

    toast({
      title: "Preparando download",
      description: `Compactando ${allFilesToDownload.length} arquivo(s)...`
    });

    const zip = new JSZip();
    let downloadedCount = 0;

    try {
      for (const file of allFilesToDownload) {
        if (!file.path) continue;
        
        try {
          const { data, error } = await supabase.storage
            .from('uploads')
            .download(file.path);

          if (error || !data) {
            console.error(`Erro ao baixar ${file.name} do storage, tentando URL pública...`, error);
            const publicUrl = `https://rqvzvcujofvfvmnqdtaz.supabase.co/storage/v1/object/public/uploads/${file.path}`;
            try {
              const response = await fetch(publicUrl);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              const blob = await response.blob();
              zip.file(file.name, blob);
              downloadedCount++;
            } catch (fallbackError) {
              console.error(`Falha também via URL pública para ${file.name}:`, fallbackError);
              continue;
            }
          } else {
            zip.file(file.name, data);
            downloadedCount++;
          }
        } catch (error) {
          console.error(`Erro ao processar ${file.name}:`, error);
        }
      }

      if (downloadedCount === 0) {
        toast({
          title: "Erro no download",
          description: "Não foi possível baixar nenhum arquivo.",
          variant: "destructive"
        });
        return;
      }

      const zipContent = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipContent);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = allFilesToDownload.length === 1 
        ? `${allFilesToDownload[0].name.split('.')[0]}.zip`
        : `arquivos_selecionados_${new Date().getTime()}.zip`;
      
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído!",
        description: `${downloadedCount} arquivo(s) baixado(s).`
      });

      clearSelection();
      
      // Esconder animação após delay
      setTimeout(() => {
        setShowDownloadAnimation(false);
      }, 2000);
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao compactar os arquivos.",
        variant: "destructive"
      });
      setShowDownloadAnimation(false);
    }
  };

  const handleSelectedDownloadIndividual = async () => {
    setShowDownloadModal(false);
    
    const selectedFiles = getSelectedFiles(files);
    const selectedFolders = getSelectedFolders(folders);
    
    if (selectedFiles.length === 0 && selectedFolders.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione arquivos ou pastas para download.",
        variant: "destructive"
      });
      return;
    }

    // Mostrar animação de download
    setShowDownloadAnimation(true);

    // Função para buscar arquivos dentro de uma pasta recursivamente
    const getFilesFromFolder = async (folderId: string): Promise<FileItem[]> => {
      try {
        const { data: folderFiles, error } = await db
          .from('files')
          .select('*')
          .eq('folder_id', folderId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          console.error('Erro ao buscar arquivos da pasta:', error);
          return [];
        }

        return folderFiles || [];
      } catch (error) {
        console.error('Erro ao buscar arquivos da pasta:', error);
        return [];
      }
    };

    // Coletar todos os arquivos das pastas selecionadas
    let allFilesToDownload = [...selectedFiles];
    
    for (const folder of selectedFolders) {
      const folderFiles = await getFilesFromFolder(folder.id);
      allFilesToDownload = [...allFilesToDownload, ...folderFiles];
    }

    // Download individual de cada arquivo
    for (const file of allFilesToDownload) {
      await handleDownloadFile(file);
    }

    clearSelection();
    
    // Esconder animação após delay
    setTimeout(() => {
      setShowDownloadAnimation(false);
    }, 2000);
  };

  const isInRootFolder = currentFolderId === null;
  const isEmpty = files.length === 0 && folders.length === 0 && (isInRootFolder ? specialFolders.length === 0 : true);
  const hasItemsToSelect = files.length > 0 || folders.length > 0;
  const selectedFiles = getSelectedFiles(files);
  const selectedFolders = getSelectedFolders(folders);

  if (isSpecialFolder && specialType) {
    return (
      <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="truncate">
                    {specialType === 'received' ? 'Recebidos' : 'Enviados'}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                    <Button
                      variant="ghost"
                      size={isMobile ? "sm" : "sm"}
                      onClick={handleHomeNavigation}
                      className="text-purple-600 hover:text-purple-700 p-1 sm:p-2"
                    >
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="ml-1 text-xs sm:text-sm">Voltar</span>
                    </Button>
                  </div>
                </CardTitle>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <EnhancedSharedFilesManager />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-sm">Carregando arquivos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-0">
      {/* Header com navegação e ações */}  
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl min-w-0">
                <span className="truncate">Meus Arquivos</span>
                {!isInRootFolder && (
                  <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                    <Button
                      variant="ghost"
                      size={isMobile ? "sm" : "sm"}
                      onClick={handleHomeNavigation}
                      className="text-purple-600 hover:text-purple-700 p-1 sm:p-2"
                    >
                      <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size={isMobile ? "sm" : "sm"}
                      onClick={handleBackNavigation}
                      className="text-purple-600 hover:text-purple-700 p-1 sm:p-2"
                    >
                      <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="ml-1 text-xs sm:text-sm">Voltar</span>
                    </Button>
                  </div>
                )}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {/* View Mode Toggle - apenas quando há arquivos */}
              {files.length > 0 && (
                <ViewModeToggle
                  currentMode={viewMode}
                  onModeChange={setViewMode}
                />
              )}
              
              {/* Selection Controls - para arquivos e pastas */}
              {hasItemsToSelect && (
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  {isSelectionMode && (
                    <>
                      <Button
                        variant="outline"
                        size={isMobile ? "sm" : "sm"}
                        onClick={() => selectAll(files, folders)}
                        className="text-xs sm:text-sm"
                      >
                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Todos
                      </Button>
                      {hasSelection && (
                        <>
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "sm"}
                            onClick={() => setShowDownloadModal(true)}
                            className="text-xs sm:text-sm"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Download ({selectedItems.size})
                          </Button>
                          <Button
                            variant="destructive"
                            size={isMobile ? "sm" : "sm"}
                            onClick={handleDeleteSelected}
                            className="text-xs sm:text-sm"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Excluir ({selectedItems.size})
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "sm"}
                    onClick={toggleSelectionMode}
                    className="text-xs sm:text-sm"
                  >
                    <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {isSelectionMode ? 'Cancelar' : 'Selecionar'}
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                size={isMobile ? "sm" : "sm"}
                onClick={() => setShowNewFolderModal(true)}
                className="text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <FolderPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nova Pasta</span>
                <span className="sm:hidden">Pasta</span>
              </Button>
              
              <div className="flex-1 sm:flex-none">
                <UploadButton
                  folderId={currentFolderId}
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-2 sm:mt-4">
            <FolderBreadcrumb 
              currentFolderId={currentFolderId} 
              onNavigate={onNavigateToFolder} 
            />
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo separado por seções */}
      {isEmpty ? (
        <EmptyState onCreateFolder={() => setShowNewFolderModal(true)} />
      ) : (
        <div className="space-y-4 sm:space-y-8">
          {/* Seção de Pastas Especiais - apenas na raiz */}
          {isInRootFolder && specialFolders.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100 px-1">
                Pastas Especiais
              </h3>
              <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence>
                  {specialFolders.map((folder) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SpecialFolderCard
                        folder={folder}
                        onNavigate={onNavigateToFolder}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Seção de Pastas Regulares */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100 px-1">
                Pastas
              </h3>
              <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence>
                  {folders.map((folder) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FolderCard
                        folder={folder}
                        onDelete={handleDeleteFolder}
                        onNavigate={onNavigateToFolder}
                        onUpdate={handleFolderUpdate}
                        onShare={handleShareFolder}
                        isSelected={selectedItems.has(folder.id)}
                        onToggleSelection={toggleSelection}
                        isSelectionMode={isSelectionMode}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Seção de Arquivos */}
          {files.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100 px-1">
                Arquivos
              </h3>
              <div className={`grid gap-2 sm:gap-4 ${
                viewMode === 'preview' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : viewMode === 'list'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                <AnimatePresence>
                  {files.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      {viewMode === 'preview' ? (
                        <FilePreviewCard
                          file={file}
                          onDelete={handleDeleteFile}
                          onRename={handleRenameFile}
                          onMove={(file) => { setMovingFileId(file.id); setShowMoveFileModal(true); }}
                          onShare={handleShareFile}
                          onDownload={handleDownloadFile}
                          showActions={true}
                          isSelected={selectedItems.has(file.id)}
                          onToggleSelection={toggleSelection}
                          isSelectionMode={isSelectionMode}
                        />
                      ) : (
                        <FileCard
                          file={file}
                          onDelete={handleDeleteFile}
                          onRename={handleRenameFile}
                          onMove={(file) => { setMovingFileId(file.id); setShowMoveFileModal(true); }}
                          onShare={handleShareFile}
                          onDownload={handleDownloadFile}
                          showActions={true}
                          isSelected={selectedItems.has(file.id)}
                          onToggleSelection={toggleSelection}
                          isSelectionMode={isSelectionMode}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de ações em lote - apenas para arquivos */}
      <BulkActionsBar
        selectedFiles={selectedFiles}
        onMoveSelected={() => setShowBulkMoveModal(true)}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={clearSelection}
      />

      {/* Modais */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreate={handleCreateFolder}
      />

      <BulkMoveModal
        isOpen={showBulkMoveModal}
        onClose={() => setShowBulkMoveModal(false)}
        selectedFiles={selectedFiles}
        onMove={handleBulkMove}
        currentFolderId={currentFolderId}
      />
      
      <MoveFileModal
        isOpen={showMoveFileModal}
        onClose={() => setShowMoveFileModal(false)}
        onMove={(folderId) => {
          if (movingFileId) {
            handleMoveFile(movingFileId, folderId);
          }
          setShowMoveFileModal(false);
          setMovingFileId(null);
        }}
        currentFolderId={currentFolderId}
      />

      <DownloadFormatModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadZip={handleSelectedDownloadZip}
        onDownloadIndividual={handleSelectedDownloadIndividual}
        selectedCount={selectedItems.size}
        hasFolder={selectedFolders.length > 0}
      />

      <EnhancedShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, item: null, type: 'file' })}
        item={shareModal.item}
        type={shareModal.type}
      />

      {/* Adicionar animação de download */}
      <DownloadAnimation
        isVisible={showDownloadAnimation}
        onComplete={() => setShowDownloadAnimation(false)}
        fileCount={selectedItems.size}
      />
    </div>
  );
};
