import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface SentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  uploaded_at: string;
  user_id: string;
  folder_id?: string;
  permission: string;
  shared_with_name: string;
  shared_with_id: string;
  is_folder?: boolean;
  share_id: string;
}

export const useSentFiles = () => {
  const [sentFiles, setSentFiles] = useState<SentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSentFiles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Buscando arquivos enviados pelo usuário:', user.id);

      // Buscar compartilhamentos de arquivos
      const { data: fileShares, error: fileError } = await supabase
        .from('file_shares')
        .select(`
          id,
          permission,
          shared_with,
          files!inner (
            id, name, type, size, path, uploaded_at, user_id, folder_id
          )
        `)
        .eq('shared_by', user.id);

      if (fileError) {
        console.error('Erro ao buscar compartilhamentos de arquivos:', fileError);
        throw fileError;
      }

      // Buscar compartilhamentos de pastas
      const { data: folderShares, error: folderError } = await supabase
        .from('folder_shares')
        .select(`
          id,
          permission,
          shared_with,
          folders!inner (
            id, name, user_id
          )
        `)
        .eq('shared_by', user.id);

      if (folderError) {
        console.error('Erro ao buscar compartilhamentos de pastas:', folderError);
        throw folderError;
      }

      // Buscar nomes dos destinatários
      const allRecipientIds = [
        ...(fileShares || []).map(share => share.shared_with),
        ...(folderShares || []).map(share => share.shared_with)
      ];
      
      const uniqueRecipientIds = [...new Set(allRecipientIds)];

      const { data: recipientProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, social_name, email')
        .in('id', uniqueRecipientIds);

      if (profileError) {
        console.error('Erro ao buscar perfis dos destinatários:', profileError);
        throw profileError;
      }

      // Criar mapa de perfis
      const profileMap = new Map();
      recipientProfiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Processar arquivos enviados
      const processedFiles: SentFile[] = [
        ...(fileShares || []).map((share) => {
          const recipient = profileMap.get(share.shared_with);
          return {
            ...share.files,
            permission: share.permission,
            shared_with_name: recipient?.social_name || recipient?.email || 'Usuário Desconhecido',
            shared_with_id: share.shared_with,
            is_folder: false,
            share_id: share.id
          };
        }),
        ...(folderShares || []).map((share) => {
          const recipient = profileMap.get(share.shared_with);
          return {
            id: share.folders.id,
            name: share.folders.name,
            type: 'folder',
            size: 0,
            path: '',
            uploaded_at: '',
            user_id: share.folders.user_id,
            folder_id: undefined,
            permission: share.permission,
            shared_with_name: recipient?.social_name || recipient?.email || 'Usuário Desconhecido',
            shared_with_id: share.shared_with,
            is_folder: true,
            share_id: share.id
          };
        })
      ];

      console.log('Arquivos enviados encontrados:', processedFiles.length);
      setSentFiles(processedFiles);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro ao carregar enviados",
        description: "Tente novamente em alguns minutos",
        variant: "destructive"
      });
      setSentFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSharedFiles = async (shareIds: string[], isFolder: boolean = false) => {
    if (!user || shareIds.length === 0) return false;

    try {
      console.log('Deletando compartilhamentos:', shareIds, 'É pasta:', isFolder);

      const tableName = isFolder ? 'folder_shares' : 'file_shares';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', shareIds)
        .eq('shared_by', user.id);

      if (error) {
        console.error('Erro ao deletar compartilhamentos:', error);
        throw error;
      }

      toast({
        title: "Compartilhamentos removidos",
        description: `${shareIds.length} compartilhamento(s) removido(s)`
      });

      // Recarregar lista
      await fetchSentFiles();
      return true;
    } catch (error) {
      console.error('Erro ao deletar compartilhamentos:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover os compartilhamentos",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchSentFiles();
    }
  }, [user]);

  return {
    sentFiles,
    loading,
    refetch: fetchSentFiles,
    deleteSharedFiles
  };
};