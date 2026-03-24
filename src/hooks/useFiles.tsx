import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: string | null;
  size: number | null;
  uploaded_at: string;
  user_id: string;
  folder_id: string | null;
}

export const useFiles = (currentFolderId: string | null = null) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;

  const fetchFiles = async () => {
    if (!user) {
      setFiles([]);
      setLoading(false);
      return;
    }

    // Se estamos em uma pasta especial, não buscar arquivos regulares
    if (currentFolderId && (currentFolderId.startsWith('special-'))) {
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching files for folder:', currentFolderId);
      console.log('User ID:', user.id);

      let query = db
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      // Corrigir o filtro para folder_id
      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching files:', error);
        setError(error.message);
        toast({
          title: "Erro ao carregar arquivos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Files fetched successfully:', data?.length || 0);
      setFiles(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para excluir arquivos",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get file info first
      const { data: fileData, error: fetchError } = await db
        .from('files')
        .select('path, name')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching file for deletion:', fetchError);
        toast({
          title: "Erro ao excluir arquivo",
          description: fetchError.message,
          variant: "destructive"
        });
        return false;
      }

      // Delete from storage (best-effort; continua em caso de erro de rede/timeout)
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([fileData.path]);

      if (storageError) {
        const msg = (storageError as any)?.message || String(storageError);
        const isNotFound = (storageError as any)?.statusCode === 404 || /not found|no such file/i.test(msg);
        const isNetworkIssue = /timeout|failed to fetch|connect|before headers|network/i.test(msg);
        if (isNotFound) {
          console.warn('File not found in storage, continuing with DB deletion:', fileData.path);
        } else if (isNetworkIssue) {
          console.warn('Network issue while deleting from storage; proceeding with DB deletion:', msg);
        } else {
          console.error('Error deleting from storage:', storageError);
          toast({
            title: 'Erro ao excluir do storage',
            description: msg,
            variant: 'destructive'
          });
          return false;
        }
      }

      // Delete from database
      const { error: dbError } = await db
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        toast({
          title: "Erro ao excluir do banco",
          description: dbError.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Arquivo excluído",
        description: `${fileData.name} foi excluído com sucesso`
      });

      // Refresh the files list
      await fetchFiles();
      return true;
    } catch (error) {
      console.error('Unexpected error deleting file:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao excluir arquivo",
        variant: "destructive"
      });
      return false;
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para renomear arquivos",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await db
        .from('files')
        .update({ name: newName })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming file:', error);
        toast({
          title: "Erro ao renomear",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Arquivo renomeado",
        description: `Arquivo renomeado para "${newName}"`
      });

      await fetchFiles();
      return true;
    } catch (error) {
      console.error('Unexpected error renaming file:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao renomear arquivo",
        variant: "destructive"
      });
      return false;
    }
  };

  const moveFile = async (fileId: string, targetFolderId: string | null) => {
    if (!user) {
      toast({
        title: "Sessão expirada",
        description: "Faça login para mover arquivos",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await db
        .from('files')
        .update({ folder_id: targetFolderId })
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error moving file:', error);
        toast({
          title: "Erro ao mover arquivo",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Arquivo movido",
        description: "Arquivo movido com sucesso"
      });

      await fetchFiles();
      return true;
    } catch (error) {
      console.error('Unexpected error moving file:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao mover arquivo",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user, currentFolderId]);

  // Real-time subscription - COM PREVENÇÃO DE SUBSCRIÇÕES DUPLICADAS
  useEffect(() => {
    if (!user) return;

    // Limpar subscrição anterior se existir
    if (channelRef.current) {
      console.log('Removing existing files channel subscription');
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.log('Error removing files channel:', error);
      }
      channelRef.current = null;
    }

    // Aguardar um pouco antes de criar nova subscrição
    const timeoutId = setTimeout(() => {
      const channelName = `files_${currentFolderId || 'root'}_${user.id}_${Date.now()}`;
      
      console.log('Creating new files channel subscription:', channelName);
      
      try {
        channelRef.current = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'files',
              filter: `user_id=eq.${user.id}`
            }, 
            (payload) => {
              console.log('File change detected:', payload);
              fetchFiles();
            }
          )
          .subscribe((status) => {
            console.log('Files subscription status:', status);
          });
      } catch (error) {
        console.error('Error creating files channel subscription:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      console.log('Cleaning up files subscription');
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.log('Error during files cleanup:', error);
        }
        channelRef.current = null;
      }
    };
  }, [user, currentFolderId]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
    deleteFile,
    renameFile,
    moveFile
  };
};
