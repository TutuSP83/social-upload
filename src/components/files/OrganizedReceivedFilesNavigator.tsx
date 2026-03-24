import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useReceivedFiles } from '@/hooks/useReceivedFiles';
import { FileCard } from './FileCard';
import { DownloadFormatModal } from './DownloadFormatModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Folder, 
  Trash2, 
  Home,
  Inbox,
  Users,
  ChevronRight,
  Download
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'senders' | 'sender' | 'folder';
}

export const OrganizedReceivedFilesNavigator = () => {
  const [navigationPath, setNavigationPath] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'Arquivos Recebidos', type: 'senders' }
  ]);
  const [currentSenderFolderId, setCurrentSenderFolderId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const { receivedFiles, senderFolders, loading, refetch, moveToMyFiles, deleteSelectedReceivedFiles } = useReceivedFiles(currentSenderFolderId);
  const isMobile = useIsMobile();
  
  // Estado de seleção
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const currentItems = getCurrentItems();
    const allIds = currentItems.map(item => item.id);
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

  // Função para obter itens atuais baseado no contexto de navegação
  const getCurrentItems = () => {
    const currentLevel = navigationPath[navigationPath.length - 1];
    
    if (currentLevel.type === 'senders') {
      return senderFolders.map(folder => ({
        ...folder,
        is_folder: true,
        type: 'sender-folder'
      }));
    }
    
    if (currentLevel.type === 'sender') {
      // Mostrar apenas itens na raiz do remetente (sem folder_id ou folder_id = null)
      return receivedFiles.filter(file => !file.folder_id || file.folder_id === null);
    }
    
    if (currentLevel.type === 'folder') {
      // Mostrar itens dentro da pasta específica
      return receivedFiles.filter(file => file.folder_id === currentFolderId);
    }
    
    return [];
  };

  const handleDeleteSelected = async () => {
    if (!hasSelection) return;

    const selectedFileIds = Array.from(selectedItems).filter(id => {
      const item = receivedFiles.find(f => f.id === id);
      return item && !item.is_folder;
    });
    
    const selectedFolderIds = Array.from(selectedItems).filter(id => {
      const item = receivedFiles.find(f => f.id === id);
      return item && item.is_folder;
    });

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

    if (files.length > 0) {
      const fileIds = files.map(f => f.id);
      const result = await moveToMyFiles(fileIds, false);
      if (!result) success = false;
    }

    if (folders.length > 0) {
      const folderIds = folders.map(f => f.id);
      const result = await moveToMyFiles(folderIds, true);
      if (!result) success = false;
    }

    if (success) {
      clearSelection();
    }
  };

  const handleDownloadFile = async (file: any) => {
    if (!file.path) {
      toast({
        title: "Erro no download",
        description: "Caminho do arquivo não encontrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('uploads')
        .download(file.path);

      if (error) {
        console.error('Erro ao baixar arquivo:', error);
        toast({
          title: "Erro no download",
          description: "Não foi possível baixar o arquivo.",
          variant: "destructive"
        });
        return;
      }

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído",
        description: `${file.name} baixado com sucesso.`
      });
    } catch (error) {
      console.error('Erro no download do arquivo:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao baixar o arquivo.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFolder = async () => {
    const currentLevel = navigationPath[navigationPath.length - 1];
    if (currentLevel.type === 'senders') return;

    const currentItems = getCurrentItems();
    const filesToDownload = currentItems.filter(item => 
      !item.is_folder && 
      'path' in item && 
      item.path
    );
    
    if (filesToDownload.length === 0) {
      toast({
        title: "Pasta vazia",
        description: "Esta pasta não contém arquivos para download.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Preparando download",
      description: `Compactando ${filesToDownload.length} arquivo(s) em formato ZIP...`
    });

    const zip = new JSZip();
    let downloadedCount = 0;

    try {
      // Download de todos os arquivos e adicionar ao ZIP
      for (const file of filesToDownload) {
        if (!('path' in file) || !file.path) continue;
        
        try {
          console.log(`Baixando arquivo: ${file.name} (${file.path})`);
          
          const { data, error } = await supabase.storage
            .from('uploads')
            .download(file.path);

          if (error) {
            console.error(`Erro ao baixar ${file.name}:`, error);
            toast({
              title: "Aviso",
              description: `Não foi possível baixar: ${file.name}`,
              variant: "destructive"
            });
            continue;
          }

          if (data) {
            zip.file(file.name, data);
            downloadedCount++;
            console.log(`Arquivo ${file.name} adicionado ao ZIP`);
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

      // Gerar e baixar o ZIP com configurações compatíveis com WinRAR
      console.log(`Gerando ZIP com ${downloadedCount} arquivos...`);
      
      const zipContent = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      const url = URL.createObjectURL(zipContent);
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo ZIP baseado na pasta atual
      const zipFileName = `${currentLevel.name.replace(/[^a-zA-Z0-9\-_\s]/g, '_')}.zip`;
      link.download = zipFileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído!",
        description: `${downloadedCount} arquivo(s) baixado(s) em ${zipFileName}`
      });

    } catch (error) {
      console.error('Erro no download da pasta:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao compactar os arquivos.",
        variant: "destructive"
      });
    }
  };

  // Função para coletar todos os arquivos de pastas selecionadas com estrutura
  const getAllFilesFromSelectedItems = async (preserveStructure = true) => {
    const allFiles = [];
    const currentItems = getCurrentItems();
    
    for (const itemId of selectedItems) {
      const item = currentItems.find(i => i.id === itemId);
      if (!item) continue;
      
      if (item.is_folder) {
        // Se é uma pasta, buscar todos os arquivos dentro dela recursivamente
        const folderFiles = await getFilesFromFolder(item.id, item.name, preserveStructure);
        allFiles.push(...folderFiles);
      } else if ('path' in item && item.path) {
        // Se é um arquivo direto
        allFiles.push({
          ...item,
          zipPath: preserveStructure ? item.name : item.name // Arquivo na raiz se preserveStructure for false
        });
      }
    }
    
    return allFiles;
  };

  // Função auxiliar para buscar arquivos de uma pasta recursivamente
  const getFilesFromFolder = async (folderId: string, folderName: string, preserveStructure = true) => {
    const files = [];
    
    // Buscar arquivos diretos da pasta
    const directFiles = receivedFiles.filter(file => 
      file.folder_id === folderId && !file.is_folder && file.path
    );
    
    for (const file of directFiles) {
      files.push({
        ...file,
        zipPath: preserveStructure ? `${folderName}/${file.name}` : file.name
      });
    }
    
    // Buscar subpastas e seus arquivos
    const subFolders = receivedFiles.filter(item => 
      item.folder_id === folderId && item.is_folder
    );
    
    for (const subFolder of subFolders) {
      const subFolderPath = preserveStructure ? `${folderName}/${subFolder.name}` : subFolder.name;
      const subFiles = await getFilesFromFolder(subFolder.id, subFolderPath, preserveStructure);
      files.push(...subFiles);
    }
    
    return files;
  };

  const handleSelectedDownloadZip = async () => {
    setShowDownloadModal(false);
    
    const filesToDownload = await getAllFilesFromSelectedItems(true); // Preservar estrutura
    
    if (filesToDownload.length === 0) {
      toast({
        title: "Nenhum arquivo encontrado",
        description: "Os itens selecionados não contêm arquivos para download.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Preparando download",
      description: `Compactando ${filesToDownload.length} arquivo(s) com estrutura de pastas...`
    });

    const zip = new JSZip();
    let downloadedCount = 0;

    try {
      for (const file of filesToDownload) {
        if (!file.path) continue;
        
        try {
          const { data, error } = await supabase.storage
            .from('uploads')
            .download(file.path);

          if (error) {
            console.error(`Erro ao baixar ${file.name}:`, error);
            continue;
          }

          if (data) {
            // Usar zipPath que inclui a estrutura de pastas
            zip.file(file.zipPath || file.name, data);
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
      
      // Nome baseado nos itens selecionados
      const selectedItemsNames = Array.from(selectedItems).map(id => {
        const item = getCurrentItems().find(i => i.id === id);
        return item?.name || 'item';
      }).slice(0, 2).join('_');
      
      link.download = `${selectedItemsNames}${selectedItems.size > 2 ? '_e_mais' : ''}_${new Date().getTime()}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído!",
        description: `${downloadedCount} arquivo(s) baixado(s) com estrutura preservada.`
      });

      clearSelection();
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao compactar os arquivos.",
        variant: "destructive"
      });
    }
  };

  const handleSelectedDownloadIndividual = async () => {
    setShowDownloadModal(false);
    
    const filesToDownload = await getAllFilesFromSelectedItems(false); // Não preservar estrutura
    
    if (filesToDownload.length === 0) {
      toast({
        title: "Nenhum arquivo encontrado",
        description: "Os itens selecionados não contêm arquivos para download.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Preparando download",
      description: `Compactando ${filesToDownload.length} arquivo(s) sem estrutura de pastas...`
    });

    const zip = new JSZip();
    let downloadedCount = 0;

    try {
      for (const file of filesToDownload) {
        if (!file.path) continue;
        
        try {
          const { data, error } = await supabase.storage
            .from('uploads')
            .download(file.path);

          if (error) {
            console.error(`Erro ao baixar ${file.name}:`, error);
            continue;
          }

          if (data) {
            // Usar apenas o nome do arquivo, sem pasta
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
      
      link.download = `Arquivos_Simples_${new Date().getTime()}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído!",
        description: `${downloadedCount} arquivo(s) baixado(s) em formato simples.`
      });

      clearSelection();
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao compactar os arquivos.",
        variant: "destructive"
      });
    }
  };

  const navigateToSender = (senderId: string, senderName: string) => {
    setCurrentSenderFolderId(senderId);
    setCurrentFolderId(null);
    setNavigationPath([
      { id: 'root', name: 'Remetentes', type: 'senders' },
      { id: senderId, name: senderName, type: 'sender' }
    ]);
    clearSelection();
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    const newPath = [...navigationPath];
    newPath.push({ id: folderId, name: folderName, type: 'folder' });
    setNavigationPath(newPath);
    clearSelection();
  };

  const navigateBack = (targetIndex: number) => {
    const newPath = navigationPath.slice(0, targetIndex + 1);
    const targetLevel = newPath[newPath.length - 1];
    
    if (targetLevel.type === 'senders') {
      setCurrentSenderFolderId(null);
      setCurrentFolderId(null);
    } else if (targetLevel.type === 'sender') {
      setCurrentFolderId(null);
    } else if (targetLevel.type === 'folder') {
      setCurrentFolderId(targetLevel.id);
    }
    
    setNavigationPath(newPath);
    clearSelection();
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 mb-4 px-1 flex-wrap">
      {navigationPath.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <Button
            onClick={() => navigateBack(index)}
            variant={index === navigationPath.length - 1 ? "default" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm h-8"
          >
            {index === 0 ? (
              <div className="flex items-center gap-1">
                <Inbox className="h-3 w-3 sm:h-4 sm:w-4" />
                {item.name}
              </div>
            ) : item.type === 'sender' ? (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                {item.name}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4" />
                {item.name}
              </div>
            )}
          </Button>
          {index < navigationPath.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Carregando arquivos recebidos...</span>
      </div>
    );
  }

  const currentItems = getCurrentItems();
  const currentLevel = navigationPath[navigationPath.length - 1];
  const shouldShowMultiSelect = currentItems.length > 0 && currentLevel.type !== 'senders';

  return (
    <div className="space-y-4">
      {renderBreadcrumb()}

      {shouldShowMultiSelect && (
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0 px-1">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentLevel.name}
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {!isSelectionMode && currentLevel.type !== 'senders' && currentItems.some(item => !item.is_folder && 'path' in item && item.path) && (
              <Button
                onClick={handleDownloadFolder}
                variant="outline"
                size={isMobile ? "sm" : "sm"}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                Baixar ZIP
              </Button>
            )}
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
                      onClick={() => setShowDownloadModal(true)}
                      variant="outline"
                      size={isMobile ? "sm" : "sm"}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      Download ({selectedItems.size})
                    </Button>
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
        </div>
      )}

      {currentItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            {currentLevel.type === 'senders' ? (
              <>
                <Inbox className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                  Nenhum arquivo recebido
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                  Arquivos compartilhados com você aparecerão aqui organizados por remetente
                </p>
              </>
            ) : (
              <>
                <Folder className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                  Pasta vazia
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
                  Esta pasta não contém arquivos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {currentItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {isSelectionMode && currentLevel.type !== 'senders' && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                    className="bg-white border-2"
                  />
                </div>
              )}
              
              {currentLevel.type === 'senders' ? (
                // Renderizar remetentes
                <Card className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigateToSender(item.shared_by, item.name)}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {item.file_count} arquivo(s) • {item.folder_count} pasta(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {item.file_count + item.folder_count} itens
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : item.is_folder ? (
                // Renderizar pastas
                <Card 
                  className={`hover:shadow-md transition-shadow ${!isSelectionMode ? 'cursor-pointer' : ''}`}
                  onClick={() => !isSelectionMode && navigateToFolder(item.id, item.name)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          Pasta compartilhada por {item.shared_by_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Pasta
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Renderizar arquivos
                <FileCard
                  file={{
                    ...item,
                    folder_id: item.folder_id || null
                  }}
                  showActions={true}
                  variant="shared-received"
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelection={toggleSelection}
                  isSelectionMode={isSelectionMode}
                  onDownload={handleDownloadFile}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      <DownloadFormatModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadZip={handleSelectedDownloadZip}
        onDownloadIndividual={handleSelectedDownloadIndividual}
        selectedCount={selectedItems.size}
        hasFolder={Array.from(selectedItems).some(id => {
          const item = getCurrentItems().find(i => i.id === id);
          return item && item.is_folder;
        })}
      />
    </div>
  );
};