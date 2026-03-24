import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSentFiles } from '@/hooks/useSentFiles';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Folder, 
  Send,
  Users,
  File,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const SentFilesNavigator = () => {
  const { sentFiles, loading } = useSentFiles();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Organizar arquivos por pastas
  const organizedData = sentFiles.reduce((acc, item) => {
    if (item.is_folder) {
      acc.folders.push(item);
    } else {
      acc.files.push(item);
    }
    return acc;
  }, { folders: [] as any[], files: [] as any[] });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 sm:h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-xs sm:text-sm">Carregando arquivos enviados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4 p-2 sm:p-0">
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-lg font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            Itens Enviados por Você
          </CardTitle>
        </CardHeader>
      </Card>

      {sentFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6 sm:py-12">
            <Send className="h-6 w-6 sm:h-12 sm:w-12 text-muted-foreground mb-2 sm:mb-4" />
            <h3 className="text-xs sm:text-lg font-medium mb-1 sm:mb-2">
              Nenhum item enviado
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-2 sm:px-4">
              Pastas e arquivos compartilhados aparecerão aqui organizados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {/* Pastas primeiro */}
          {organizedData.folders.map((folder) => (
            <motion.div
              key={`folder-${folder.share_id}-${folder.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className="border-l-4 border-l-blue-500 transition-shadow">
                <CardContent className="p-2 sm:p-4">
                  <div 
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs sm:text-base truncate">
                          📁 {folder.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span className="truncate">{folder.shared_with_name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        Pasta
                      </Badge>
                      <Badge variant={folder.permission === 'edit' ? 'default' : 'secondary'} className="text-xs">
                        {folder.permission === 'edit' ? 'Editar' : 'Ver'}
                      </Badge>
                      <ChevronRight 
                        className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${
                          expandedFolders.has(folder.id) ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>
                  
                  {/* Conteúdo da pasta expandida */}
                  {expandedFolders.has(folder.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 sm:mt-3 pl-4 sm:pl-6 border-l-2 border-gray-200 dark:border-gray-700"
                    >
                      <div className="space-y-1 sm:space-y-2">
                        {/* Aqui mostraria os arquivos da pasta, mas como mencionado, apenas text */}
                        <p className="text-xs text-muted-foreground italic">
                          📄 Conteúdo da pasta compartilhada
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pasta enviada para visualização do destinatário
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Arquivos depois */}
          {organizedData.files.map((file) => (
            <motion.div
              key={`file-${file.share_id}-${file.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className="border-l-4 border-l-green-500 transition-shadow">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <File className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs sm:text-base truncate">
                        📄 {file.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="truncate">{file.shared_with_name}</span>
                      </div>
                      {file.uploaded_at && (
                        <p className="text-xs text-muted-foreground">
                          Enviado em {formatDate(file.uploaded_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {file.size > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      )}
                      <Badge variant={file.permission === 'edit' ? 'default' : 'secondary'} className="text-xs">
                        {file.permission === 'edit' ? 'Editar' : 'Ver'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};