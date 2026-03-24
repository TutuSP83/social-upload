import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedReceivedFilesNavigator } from './EnhancedReceivedFilesNavigator';
import { SentFilesNavigator } from './SentFilesNavigator';
import { useReceivedFiles } from '@/hooks/useReceivedFiles';
import { FileCard } from './FileCard';
import { 
  Share2, 
  Download, 
  Trash2, 
  Eye,
  Folder,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const db = supabase as any;

export const SharedFilesManager = () => {
  const [activeTab, setActiveTab] = useState('received');
  const { user } = useAuth();
  const { clearAllReceivedFiles, refetch } = useReceivedFiles();

  const handleDeleteReceived = async () => {
    console.log('Iniciando exclusão de arquivos e pastas recebidos...');
    const success = await clearAllReceivedFiles();
    if (success) {
      console.log('Exclusão concluída com sucesso, atualizando interface...');
      await refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Arquivos Compartilhados
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Recebidos
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Enviados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Arquivos Recebidos
            </h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir arquivos e pastas
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir todos os arquivos e pastas recebidos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá permanentemente todos os arquivos e pastas que foram compartilhados com você. 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteReceived} className="bg-red-600 hover:bg-red-700">
                    Excluir Todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <EnhancedReceivedFilesNavigator />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <SentFilesNavigator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SentFilesManager = () => {
  const [sentFiles, setSentFiles] = useState<any[]>([]);
  const [sentFolders, setSentFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSentItems = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Buscando itens enviados para usuário:', user.id);

        if (selectedFolder) {
          // Buscar arquivos da pasta selecionada
          const { data: folderFiles, error: filesError } = await db
            .from('files')
            .select('*')
            .eq('folder_id', selectedFolder)
            .eq('user_id', user.id);

          // Buscar subpastas
          const { data: subFolders, error: foldersError } = await db
            .from('folders')
            .select('*')
            .eq('parent_folder_id', selectedFolder)
            .eq('user_id', user.id);

          if (!filesError && folderFiles) {
            setSentFiles(folderFiles);
          }

          if (!foldersError && subFolders) {
            setSentFolders(subFolders);
          }
        } else {
          // Buscar arquivos compartilhados pelo usuário
          const { data: fileShares, error: fileError } = await db
            .from('file_shares')
            .select(`
              id,
              shared_with,
              permission,
              created_at,
              files!inner (id, name, type, size, path, uploaded_at, folder_id)
            `)
            .eq('shared_by', user.id);

          // Buscar pastas compartilhadas pelo usuário
          const { data: folderShares, error: folderError } = await db
            .from('folder_shares')
            .select(`
              id,
              shared_with,
              permission,
              created_at,
              folders!inner (id, name, created_at, parent_folder_id)
            `)
            .eq('shared_by', user.id);

          // Agrupar por pasta/arquivo
          const filesByItem = new Map();
          const foldersByItem = new Map();

          if (fileShares) {
            fileShares.forEach((share: any) => {
              const fileId = share.files.id;
              if (!filesByItem.has(fileId)) {
                filesByItem.set(fileId, {
                  ...share.files,
                  shares: []
                });
              }
              filesByItem.get(fileId).shares.push({
                shared_with: share.shared_with,
                permission: share.permission,
                created_at: share.created_at
              });
            });
          }

          if (folderShares) {
            folderShares.forEach((share: any) => {
              const folderId = share.folders.id;
              if (!foldersByItem.has(folderId)) {
                foldersByItem.set(folderId, {
                  ...share.folders,
                  type: 'folder',
                  shares: []
                });
              }
              foldersByItem.get(folderId).shares.push({
                shared_with: share.shared_with,
                permission: share.permission,
                created_at: share.created_at
              });
            });
          }

          setSentFiles(Array.from(filesByItem.values()));
          setSentFolders(Array.from(foldersByItem.values()));
        }
      } catch (error) {
        console.error('Erro ao buscar itens enviados:', error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar os arquivos enviados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSentItems();
    }
  }, [user, selectedFolder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (selectedFolder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSelectedFolder(null)}
            variant="outline"
            size="sm"
          >
            ← Voltar
          </Button>
          <h3 className="text-lg font-semibold">Conteúdo da Pasta</h3>
        </div>

        {sentFolders.length === 0 && sentFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Pasta vazia
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta pasta não contém arquivos ou subpastas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sentFolders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Folder className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Pasta criada em {formatDate(folder.created_at)}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedFolder(folder.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Conteúdo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sentFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                showActions={false}
                variant="shared-sent"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Arquivos Enviados
      </h2>
      
      {sentFiles.length === 0 && sentFolders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum arquivo enviado
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Arquivos e pastas que você compartilhar aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sentFolders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Folder className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Compartilhada com {folder.shares?.length || 0} pessoa(s)
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(folder.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {folder.shares?.length || 0} compartilhamentos
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir compartilhamentos da pasta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso removerá todos os compartilhamentos desta pasta "{folder.name}". 
                            A pasta original permanecerá em "Meus Arquivos".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                          onClick={async () => {
                            try {
                              const { error } = await db
                                .from('folder_shares')
                                .delete()
                                .eq('folder_id', folder.id)
                                .eq('shared_by', user?.id);

                                if (error) throw error;

                                toast({
                                  title: "Compartilhamentos removidos",
                                  description: `Todos os compartilhamentos da pasta "${folder.name}" foram removidos`
                                });

                                // Recarregar dados
                                setSentFolders(prev => prev.filter(f => f.id !== folder.id));
                              } catch (error) {
                                console.error('Erro ao excluir compartilhamentos:', error);
                                toast({
                                  title: "Erro",
                                  description: "Não foi possível remover os compartilhamentos",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir Compartilhamentos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sentFiles.map((file) => (
            <div key={file.id} className="relative">
              <FileCard
                file={{
                  ...file,
                  shared_count: file.shares?.length || 0
                }}
                showActions={false}
                variant="shared-sent"
              />
              <div className="absolute top-2 right-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir compartilhamentos do arquivo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá todos os compartilhamentos do arquivo "{file.name}". 
                        O arquivo original permanecerá em "Meus Arquivos".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={async () => {
                          try {
                            const { error } = await db
                              .from('file_shares')
                              .delete()
                              .eq('file_id', file.id)
                              .eq('shared_by', user?.id);

                            if (error) throw error;

                            toast({
                              title: "Compartilhamentos removidos",
                              description: `Todos os compartilhamentos do arquivo "${file.name}" foram removidos`
                            });

                            // Recarregar dados
                            setSentFiles(prev => prev.filter(f => f.id !== file.id));
                          } catch (error) {
                            console.error('Erro ao excluir compartilhamentos:', error);
                            toast({
                              title: "Erro",
                              description: "Não foi possível remover os compartilhamentos",
                              variant: "destructive"
                            });
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir Compartilhamentos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
