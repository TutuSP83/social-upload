import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  parent_folder_id?: string | null;
  created_at: string;
  file_count?: number;
  folder_count?: number;
}

export const useFolders = (currentFolderId: string | null = null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;

  const fetchFolders = async () => {
    if (!user) {
      setFolders([]);
      setLoading(false);
      return;
    }

    // Se estamos em uma pasta especial, não buscar pastas regulares
    if (currentFolderId && (currentFolderId.startsWith('special-'))) {
      setFolders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching folders for parent:', currentFolderId);
      console.log('User ID:', user.id);

      let query = db
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (currentFolderId) {
        query = query.eq('parent_folder_id', currentFolderId);
      } else {
        query = query.is('parent_folder_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching folders:', error);
        setError(error.message);
        toast({
          title: "Erro ao carregar pastas",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Folders fetched successfully:', data?.length || 0);
      
      // Buscar contagens em lote para evitar N+1 requisições e erros 503
      const folderIds = (data || []).map((f) => f.id);

      // Mapas de contagem
      const fileCountMap = new Map<string, number>();
      const subfolderCountMap = new Map<string, number>();

      if (folderIds.length > 0) {
        // Buscar todos os arquivos das pastas listadas (apenas ids mínimos)
          const [{ data: filesRows, error: filesErr }, { data: childFolders, error: childErr }] = await Promise.all([
            db
              .from('files')
              .select('id, folder_id')
              .in('folder_id', folderIds)
              .eq('user_id', user.id),
            db
              .from('folders')
              .select('id, parent_folder_id')
              .in('parent_folder_id', folderIds)
              .eq('user_id', user.id)
          ]);

        if (filesErr) {
          console.warn('Falha ao buscar arquivos para contagem (prosseguindo com 0):', filesErr);
        } else {
          (filesRows || []).forEach((r: any) => {
            fileCountMap.set(r.folder_id, (fileCountMap.get(r.folder_id) || 0) + 1);
          });
        }

        if (childErr) {
          console.warn('Falha ao buscar subpastas para contagem (prosseguindo com 0):', childErr);
        } else {
          (childFolders || []).forEach((r: any) => {
            const pid = r.parent_folder_id;
            subfolderCountMap.set(pid, (subfolderCountMap.get(pid) || 0) + 1);
          });
        }
      }

      const foldersWithCounts = (data || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        user_id: folder.user_id || user.id,
        parent_folder_id: folder.parent_folder_id,
        created_at: folder.created_at || new Date().toISOString(),
        file_count: fileCountMap.get(folder.id) || 0,
        folder_count: subfolderCountMap.get(folder.id) || 0
      }));
      
      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado ao carregar pastas');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para criar pastas",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await db
        .from('folders')
        .insert({
          name,
          user_id: user.id,
          parent_folder_id: currentFolderId
        });

      if (error) {
        console.error('Error creating folder:', error);
        toast({
          title: "Erro ao criar pasta",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Pasta criada",
        description: `Pasta "${name}" criada com sucesso`
      });

      await fetchFolders();
      return true;
    } catch (error) {
      console.error('Unexpected error creating folder:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao criar pasta",
        variant: "destructive"
      });
      return false;
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para renomear pastas",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await db
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming folder:', error);
        toast({
          title: "Erro ao renomear pasta",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Pasta renomeada",
        description: `Pasta renomeada para "${newName}"`
      });

      await fetchFolders();
      return true;
    } catch (error) {
      console.error('Unexpected error renaming folder:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao renomear pasta",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para excluir pastas",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Recolher recursivamente subpastas e arquivos
      const queue: string[] = [folderId];
      const foldersToDelete: string[] = [];
      const filesToDelete: { id: string; path: string }[] = [];

      while (queue.length) {
        const current = queue.shift()!;
        foldersToDelete.push(current);

        // Subpastas
        const { data: subfolders, error: cfErr } = await db
          .from('folders')
          .select('id')
          .eq('parent_folder_id', current)
          .eq('user_id', user.id);
        if (cfErr) throw cfErr;
        queue.push(...(subfolders?.map((f: any) => f.id) || []));

        // Arquivos na pasta atual
        const { data: folderFiles, error: ffErr } = await db
          .from('files')
          .select('id, path')
          .eq('folder_id', current)
          .eq('user_id', user.id);
        if (ffErr) throw ffErr;
        filesToDelete.push(...((folderFiles as any[]) || []));
      }

      // Excluir do storage (best-effort: continuar sempre, mesmo com erro de rede/timeout)
      if (filesToDelete.length) {
        const paths = filesToDelete.map(f => f.path);
        try {
          const { error: storageError } = await supabase.storage
            .from('uploads')
            .remove(paths);
          if (storageError) {
            console.warn('Erro ao remover do storage; prosseguindo com remoção dos registros.', storageError);
          }
        } catch (err: any) {
          console.warn('Falha ao comunicar com storage (timeout/rede); prosseguindo com remoção dos registros.', err?.message || err);
        }
      }

      // Excluir registros de arquivos
      if (filesToDelete.length) {
        const { error: dbFilesError } = await db
          .from('files')
          .delete()
          .in('id', filesToDelete.map(f => f.id))
          .eq('user_id', user.id);
        if (dbFilesError) throw dbFilesError;
      }

      // Excluir pastas (todas coletadas)
      if (foldersToDelete.length) {
        const { error: dbFoldersError } = await db
          .from('folders')
          .delete()
          .in('id', foldersToDelete)
          .eq('user_id', user.id);
        if (dbFoldersError) throw dbFoldersError;
      }

      toast({
        title: 'Pasta excluída',
        description: 'A pasta e todo o conteúdo foram removidos'
      });

      await fetchFolders();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir pasta recursivamente:', error);
      toast({
        title: 'Erro ao excluir pasta',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [user, currentFolderId]);

  // Escutar mudanças em tempo real - COM PREVENÇÃO DE SUBSCRIÇÕES DUPLICADAS
  useEffect(() => {
    if (!user) return;

    // Limpar subscrição anterior se existir
    if (channelRef.current) {
      console.log('Removing existing channel subscription');
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.log('Error removing channel:', error);
      }
      channelRef.current = null;
    }

    // Aguardar um pouco antes de criar nova subscrição
    const timeoutId = setTimeout(() => {
      const channelName = `folders_${currentFolderId || 'root'}_${user.id}_${Date.now()}`;
      
      console.log('Creating new channel subscription:', channelName);
      
      try {
        channelRef.current = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'folders',
              filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
              console.log('Folder change detected:', payload);
              fetchFolders();
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });
      } catch (error) {
        console.error('Error creating channel subscription:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      console.log('Cleaning up folder subscription');
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.log('Error during cleanup:', error);
        }
        channelRef.current = null;
      }
    };
  }, [user, currentFolderId]);

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    createFolder,
    deleteFolder,
    renameFolder
  };
};
