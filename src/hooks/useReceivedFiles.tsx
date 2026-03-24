
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ReceivedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  uploaded_at: string;
  user_id: string;
  folder_id?: string;
  permission: string;
  shared_by_name: string;
  shared_by_id: string;
  sender_folder_id: string;
  sender_folder_name: string;
  is_folder?: boolean;
}

export const useReceivedFiles = (senderFolderId?: string) => {
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [senderFolders, setSenderFolders] = useState<Array<{
    id: string;
    name: string;
    shared_by: string;
    shared_by_name: string;
    file_count: number;
    folder_count: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReceivedFiles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Buscando arquivos recebidos para usuário:', user.id);

      if (senderFolderId) {
        console.log('Buscando arquivos da pasta do remetente:', senderFolderId);
        
        // Buscar arquivos compartilhados por este remetente
        const { data: fileShares, error: fileError } = await supabase
          .from('file_shares')
          .select(`
            permission,
            file_id,
            shared_by,
            files!inner (
              id, name, type, size, path, uploaded_at, user_id, folder_id
            )
          `)
          .eq('shared_with', user.id)
          .eq('shared_by', senderFolderId);

        if (fileError) {
          console.error('Erro ao buscar arquivos:', fileError);
          throw fileError;
        }

        // Buscar pastas compartilhadas por este remetente
        const { data: folderShares, error: folderError } = await supabase
          .from('folder_shares')
          .select(`
            permission,
            folder_id,
            shared_by,
            folders!inner (
              id, name, user_id, parent_folder_id
            )
          `)
          .eq('shared_with', user.id)
          .eq('shared_by', senderFolderId);

        if (folderError) {
          console.error('Erro ao buscar pastas:', folderError);
          throw folderError;
        }

        // Buscar nome do remetente
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('social_name, email')
          .eq('id', senderFolderId)
          .single();

        const senderName = senderProfile?.social_name || senderProfile?.email || 'Usuário Desconhecido';

        // Processar arquivos e pastas - incluir informação da pasta pai
        const filesWithNames = [
          ...(fileShares || []).map((item) => ({
            ...item.files,
            permission: item.permission,
            shared_by_name: senderName,
            shared_by_id: item.shared_by,
            sender_folder_id: '',
            sender_folder_name: senderName,
            is_folder: false,
            parent_folder_id: item.files.folder_id,
            user_id: item.files.user_id // Garantir que o user_id do arquivo está presente
          })),
          ...(folderShares || []).map((item) => ({
            id: item.folders.id,
            name: item.folders.name,
            type: 'folder',
            size: 0,
            path: '',
            uploaded_at: '',
            user_id: item.folders.user_id,
            folder_id: undefined,
            permission: item.permission,
            shared_by_name: senderName,
            shared_by_id: item.shared_by,
            sender_folder_id: '',
            sender_folder_name: senderName,
            is_folder: true,
            parent_folder_id: item.folders.parent_folder_id
          }))
        ];

        console.log('Itens encontrados do remetente:', filesWithNames.length);
        setReceivedFiles(filesWithNames);
      } else {
        // Buscar todos os remetentes únicos
        console.log('Buscando remetentes únicos...');
        
        // Buscar compartilhamentos de arquivos e pastas
        const { data: fileSharesData, error: fileSharesError } = await supabase
          .from('file_shares')
          .select('shared_by')
          .eq('shared_with', user.id);

        if (fileSharesError) {
          console.error('Erro ao buscar compartilhamentos de arquivos:', fileSharesError);
          throw fileSharesError;
        }

        const { data: folderSharesData, error: folderSharesError } = await supabase
          .from('folder_shares')
          .select('shared_by')
          .eq('shared_with', user.id);

        if (folderSharesError) {
          console.error('Erro ao buscar compartilhamentos de pastas:', folderSharesError);
          throw folderSharesError;
        }

        // Se não há compartilhamentos, definir como array vazio
        if ((!fileSharesData || fileSharesData.length === 0) && 
            (!folderSharesData || folderSharesData.length === 0)) {
          console.log('Nenhum compartilhamento encontrado');
          setSenderFolders([]);
          setReceivedFiles([]);
          return;
        }

        // Encontrar remetentes únicos
        const allSenders = [
          ...(fileSharesData || []).map(share => share.shared_by),
          ...(folderSharesData || []).map(share => share.shared_by)
        ];
        const uniqueSenders = new Set(allSenders);
        console.log('Remetentes únicos encontrados:', uniqueSenders.size);

        // Buscar informações dos remetentes e criar "pastas virtuais"
        const senderFoldersWithInfo = await Promise.all(
          Array.from(uniqueSenders).map(async (senderId) => {
            // Buscar nome do remetente
            const { data: profileData } = await supabase
              .from('profiles')
              .select('social_name, email')
              .eq('id', senderId)
              .single();

            // Contar arquivos compartilhados por este remetente
            const { count: fileCount } = await supabase
              .from('file_shares')
              .select('*', { count: 'exact', head: true })
              .eq('shared_with', user.id)
              .eq('shared_by', senderId);

            // Contar pastas compartilhadas por este remetente
            const { count: folderCount } = await supabase
              .from('folder_shares')
              .select('*', { count: 'exact', head: true })
              .eq('shared_with', user.id)
              .eq('shared_by', senderId);

            return {
              id: `sender-${senderId}`,
              name: profileData?.social_name || profileData?.email || 'Usuário Desconhecido',
              shared_by: senderId,
              shared_by_name: profileData?.social_name || profileData?.email || 'Usuário Desconhecido',
              file_count: fileCount || 0,
              folder_count: folderCount || 0
            };
          })
        );

        // Filtrar apenas remetentes com conteúdo compartilhado
        const validSenderFolders = senderFoldersWithInfo.filter(f => f.file_count > 0 || f.folder_count > 0);
        
        console.log('Remetentes válidos encontrados:', validSenderFolders.length);
        setSenderFolders(validSenderFolders);
        setReceivedFiles([]);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro ao carregar arquivos",
        description: "Tente novamente em alguns minutos",
        variant: "destructive"
      });
      setSenderFolders([]);
      setReceivedFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const moveToMyFiles = async (fileIds: string[], isFolder: boolean = false) => {
    if (!user || fileIds.length === 0) return false;

    try {
      console.log('Movendo para "Meus Arquivos":', fileIds, 'É pasta:', isFolder);

      if (isFolder) {
        // Para pastas, criar cópias recursivamente
        for (const folderId of fileIds) {
          const { data: originalFolder, error: fetchError } = await supabase
            .from('folders')
            .select('name')
            .eq('id', folderId)
            .single();

          if (fetchError || !originalFolder) {
            console.error('Erro ao buscar pasta original:', fetchError);
            continue;
          }

          // Criar nova pasta na raiz do usuário
          const { data: newFolder, error: createFolderError } = await supabase
            .from('folders')
            .insert({
              name: originalFolder.name,
              user_id: user.id,
              parent_folder_id: null // Pasta raiz
            })
            .select('id')
            .single();

          if (createFolderError) {
            console.error('Erro ao criar nova pasta:', createFolderError);
            continue;
          }

          console.log('Pasta copiada com sucesso:', originalFolder.name);
        }
      } else {
        // Para arquivos, criar cópias na raiz do usuário
        for (const fileId of fileIds) {
          const { data: originalFile, error: fetchError } = await supabase
            .from('files')
            .select('name, type, size, path')
            .eq('id', fileId)
            .single();

          if (fetchError || !originalFile) {
            console.error('Erro ao buscar arquivo original:', fetchError);
            continue;
          }

          // Criar nova entrada de arquivo na raiz do usuário
          const { error: createError } = await supabase
            .from('files')
            .insert({
              name: originalFile.name,
              type: originalFile.type,
              size: originalFile.size,
              path: originalFile.path,
              user_id: user.id,
              folder_id: null // Pasta raiz
            });

          if (createError) {
            console.error('Erro ao criar novo arquivo:', createError);
          } else {
            console.log('Arquivo copiado com sucesso:', originalFile.name);
          }
        }
      }

      toast({
        title: "Itens movidos",
        description: `${fileIds.length} item(s) copiado(s) para "Meus Arquivos"`
      });

      return true;
    } catch (error) {
      console.error('Erro ao mover itens:', error);
      toast({
        title: "Erro ao mover",
        description: "Não foi possível mover os itens",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteAllReceivedFiles = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('Excluindo TODOS os compartilhamentos recebidos pelo usuário:', user.id);

      // Deletar TODOS os compartilhamentos de arquivos onde o usuário é o receptor
      const { error: fileSharesError } = await supabase
        .from('file_shares')
        .delete()
        .eq('shared_with', user.id);

      if (fileSharesError) {
        console.error('Erro ao deletar file_shares:', fileSharesError);
        throw fileSharesError;
      }

      // Deletar TODOS os compartilhamentos de pastas onde o usuário é o receptor  
      const { error: folderSharesError } = await supabase
        .from('folder_shares')
        .delete()
        .eq('shared_with', user.id);

      if (folderSharesError) {
        console.error('Erro ao deletar folder_shares:', folderSharesError);
        throw folderSharesError;
      }

      console.log('Todos os compartilhamentos foram excluídos com sucesso');

      // Limpar estados locais após sucesso na base de dados
      setReceivedFiles([]);
      setSenderFolders([]);

      toast({
        title: "Sucesso",
        description: "Todos os arquivos e pastas recebidos foram excluídos permanentemente"
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir compartilhamentos:', error);
      // Recarregar dados em caso de erro
      await fetchReceivedFiles();
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os arquivos e pastas",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteSelectedReceivedFiles = async (fileIds: string[], folderIds: string[] = []) => {
    if (!user) {
      console.log('DEBUG: Usuário não logado');
      return false;
    }
    
    if (fileIds.length === 0 && folderIds.length === 0) {
      console.log('DEBUG: Nenhum ID fornecido para deletar');
      return false;
    }

    try {
      console.log('DEBUG: Deletando compartilhamentos recebidos:', { fileIds, folderIds, userId: user.id });

      let totalDeleted = 0;
      let errors = [];

      // Deletar compartilhamentos de arquivos - usando WHERE file_id IN (...) AND shared_with = user.id
      if (fileIds.length > 0) {
        console.log('DEBUG: Deletando file_shares para arquivos:', fileIds);
        
        // Tentar deletar um por vez para melhor controle
        for (const fileId of fileIds) {
          try {
            const { error, count } = await supabase
              .from('file_shares')
              .delete({ count: 'exact' })
              .eq('file_id', fileId)
              .eq('shared_with', user.id);

            if (error) {
              console.error(`DEBUG: Erro ao deletar share do arquivo ${fileId}:`, error);
              errors.push(`Arquivo ${fileId}: ${error.message}`);
            } else {
              console.log(`DEBUG: Share do arquivo ${fileId} deletado. Count:`, count);
              totalDeleted += count || 0;
            }
          } catch (err) {
            console.error(`DEBUG: Erro inesperado ao deletar arquivo ${fileId}:`, err);
            errors.push(`Erro inesperado no arquivo ${fileId}`);
          }
        }
      }

      // Deletar compartilhamentos de pastas - usando WHERE folder_id IN (...) AND shared_with = user.id  
      if (folderIds.length > 0) {
        console.log('DEBUG: Deletando folder_shares para pastas:', folderIds);
        
        // Tentar deletar um por vez para melhor controle
        for (const folderId of folderIds) {
          try {
            const { error, count } = await supabase
              .from('folder_shares')
              .delete({ count: 'exact' })
              .eq('folder_id', folderId)
              .eq('shared_with', user.id);

            if (error) {
              console.error(`DEBUG: Erro ao deletar share da pasta ${folderId}:`, error);
              errors.push(`Pasta ${folderId}: ${error.message}`);
            } else {
              console.log(`DEBUG: Share da pasta ${folderId} deletado. Count:`, count);
              totalDeleted += count || 0;
            }
          } catch (err) {
            console.error(`DEBUG: Erro inesperado ao deletar pasta ${folderId}:`, err);
            errors.push(`Erro inesperado na pasta ${folderId}`);
          }
        }
      }

      console.log('DEBUG: Total de items deletados:', totalDeleted);
      console.log('DEBUG: Erros encontrados:', errors);

      if (errors.length > 0 && totalDeleted === 0) {
        toast({
          title: "Erro ao remover",
          description: `Falhas: ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`,
          variant: "destructive"
        });
        return false;
      }

      if (totalDeleted === 0) {
        toast({
          title: "Nenhum item removido",
          description: "Não foi possível remover os itens selecionados",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso!",
        description: `${totalDeleted} compartilhamento(s) removido(s)${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`
      });

      // Recarregar dados
      await fetchReceivedFiles();
      return true;
    } catch (error) {
      console.error('DEBUG: Erro inesperado geral:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover os itens selecionados",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchReceivedFiles();
    }
  }, [user, senderFolderId]);

  return {
    receivedFiles,
    senderFolders,
    loading,
    refetch: fetchReceivedFiles,
    moveToMyFiles,
    clearAllReceivedFiles: deleteAllReceivedFiles,
    deleteSelectedReceivedFiles
  };
};
