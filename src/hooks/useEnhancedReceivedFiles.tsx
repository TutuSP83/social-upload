import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface EnhancedReceivedFile {
  id: string;
  name: string;
  type: string;
  size?: number;
  path: string;
  uploaded_at: string;
  user_id: string;
  folder_id?: string;
  permission: 'view' | 'edit';
  shared_by_name: string;
  shared_by_id: string;
  sender_folder_id: string;
  sender_folder_name: string;
  is_folder: boolean;
  share_id: string;
  // Para navegação em pastas
  parent_folder_id?: string;
  children?: EnhancedReceivedFile[];
}

export const useEnhancedReceivedFiles = (currentSenderFolderId?: string) => {
  const [receivedItems, setReceivedItems] = useState<EnhancedReceivedFile[]>([]);
  const [senderFolders, setSenderFolders] = useState<EnhancedReceivedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const { user } = useAuth();

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;

  const fetchReceivedItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (!currentSenderFolderId) {
        // Buscar pastas de remetentes (nível raiz)
        const { data: senderData, error: senderError } = await db
          .from('folder_shares')
          .select(`
            id,
            shared_by,
            sender_folder_id,
            created_at,
            permission
          `)
          .eq('shared_with', user.id)
          .not('sender_folder_id', 'is', null);

        if (senderError) {
          console.error('Erro ao buscar remetentes:', senderError);
          return;
        }

        // Buscar nomes dos remetentes
        const senderIds = [...new Set(senderData?.map((s: any) => s.shared_by) || [])];
        const { data: profilesData } = await db
          .from('profiles')
          .select('id, social_name')
          .in('id', senderIds);

        const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p.social_name]) || []);

        // Agrupar por remetente
        const sendersMap = new Map();
        senderData?.forEach((share: any) => {
          const senderId = share.shared_by;
          const senderName = profilesMap.get(senderId) || 'Usuário Desconhecido';
          
          if (!sendersMap.has(senderId)) {
            sendersMap.set(senderId, {
              id: senderId,
              name: senderName,
              type: 'folder',
              is_folder: true,
              shared_by_id: senderId,
              shared_by_name: senderName,
              sender_folder_id: share.sender_folder_id,
              permission: share.permission,
              created_at: share.created_at,
              path: '',
              uploaded_at: share.created_at,
              user_id: senderId,
              share_id: share.id
            });
          }
        });

        setSenderFolders(Array.from(sendersMap.values()));
        setReceivedItems([]);
      } else {
        // Buscar itens dentro de uma pasta de remetente específica
        const [filesData, foldersData] = await Promise.all([
          // Buscar arquivos
          db
            .from('file_shares')
            .select(`
              id,
              file_id,
              permission,
              created_at,
              shared_by,
              sender_folder_id,
              files (
                id,
                name,
                type,
                size,
                path,
                uploaded_at,
                user_id,
                folder_id
              )
            `)
            .eq('shared_with', user.id)
            .eq('sender_folder_id', currentSenderFolderId),

          // Buscar pastas
          db
            .from('folder_shares')
            .select(`
              id,
              folder_id,
              permission,
              created_at,
              shared_by,
              sender_folder_id,
              folders (
                id,
                name,
                user_id,
                parent_folder_id,
                created_at
              )
            `)
            .eq('shared_with', user.id)
            .eq('sender_folder_id', currentSenderFolderId)
        ]);

        // Buscar nomes dos remetentes para os itens
        const allSharerIds = [
          ...(filesData.data?.map((s: any) => s.shared_by) || []),
          ...(foldersData.data?.map((s: any) => s.shared_by) || [])
        ];
        const uniqueSharerIds = [...new Set(allSharerIds)];
        
        const { data: sharerProfiles } = await db
          .from('profiles')
          .select('id, social_name')
          .in('id', uniqueSharerIds);

        const sharerProfilesMap = new Map(sharerProfiles?.map((p: any) => [p.id, p.social_name]) || []);

        const items: EnhancedReceivedFile[] = [];

        // Processar arquivos
        filesData.data?.forEach((share: any) => {
          if (share.files) {
            const sharerName = sharerProfilesMap.get(share.shared_by) || 'Usuário Desconhecido';
            items.push({
              id: share.files.id,
              name: share.files.name,
              type: share.files.type || 'unknown',
              size: share.files.size || 0,
              path: share.files.path,
              uploaded_at: share.files.uploaded_at,
              user_id: share.files.user_id,
              folder_id: share.files.folder_id,
              permission: share.permission as 'view' | 'edit',
              shared_by_name: sharerName,
              shared_by_id: String(share.shared_by),
              sender_folder_id: String(share.sender_folder_id || ''),
              sender_folder_name: sharerName,
              is_folder: false,
              share_id: share.id
            });
          }
        });

        // Processar pastas
        foldersData.data?.forEach((share: any) => {
          if (share.folders) {
            const sharerName = sharerProfilesMap.get(share.shared_by) || 'Usuário Desconhecido';
            items.push({
              id: share.folders.id,
              name: share.folders.name,
              type: 'folder',
              path: '',
              uploaded_at: share.folders.created_at,
              user_id: share.folders.user_id,
              parent_folder_id: share.folders.parent_folder_id,
              permission: share.permission as 'view' | 'edit',
              shared_by_name: sharerName,
              shared_by_id: String(share.shared_by),
              sender_folder_id: String(share.sender_folder_id || ''),
              sender_folder_name: sharerName,
              is_folder: true,
              share_id: share.id
            });
          }
        });

        setReceivedItems(items);
        setSenderFolders([]);
      }
    } catch (error) {
      console.error('Erro ao buscar itens recebidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveToMyFiles = async (selectedItems: string[], isFolder: boolean = false) => {
    if (!user || selectedItems.length === 0) return false;

    try {
      const itemsToMove = receivedItems.filter(item => 
        selectedItems.includes(item.id) && item.is_folder === isFolder
      );

      for (const item of itemsToMove) {
        if (item.is_folder) {
          // Copiar pasta recursivamente
          await copyFolderRecursively(item.id, null, item.shared_by_id, user.id);
        } else {
          // Copiar arquivo
          await copyFileToUserFolder(item, user.id);
        }
      }

      toast({
        title: "Sucesso",
        description: `${itemsToMove.length} ${isFolder ? 'pasta(s)' : 'arquivo(s)'} movido(s) para "Meus Arquivos"`,
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao mover para Meus Arquivos:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover itens para Meus Arquivos",
        variant: "destructive"
      });
      return false;
    }
  };

  const copyFolderRecursively = async (
    folderId: string, 
    parentId: string | null, 
    originalUserId: string, 
    newUserId: string
  ): Promise<string> => {
    // Buscar dados da pasta original
    const { data: folderData } = await db
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (!folderData) throw new Error('Pasta não encontrada');

    // Criar nova pasta
    const { data: newFolder, error } = await db
      .from('folders')
      .insert({
        name: folderData.name,
        user_id: newUserId,
        parent_folder_id: parentId
      })
      .select()
      .single();

    if (error || !newFolder) throw error;

    // Copiar arquivos da pasta
    const { data: files } = await db
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .eq('user_id', originalUserId);

    if (files) {
      for (const file of files as any[]) {
        await db
          .from('files')
          .insert({
            name: file.name,
            type: file.type,
            size: file.size,
            path: file.path, // Manter o mesmo path do storage
            user_id: newUserId,
            folder_id: newFolder.id
          });
      }
    }

    // Copiar subpastas recursivamente
    const { data: subfolders } = await db
      .from('folders')
      .select('id')
      .eq('parent_folder_id', folderId)
      .eq('user_id', originalUserId);

    if (subfolders) {
      for (const subfolder of subfolders as any[]) {
        await copyFolderRecursively(subfolder.id, newFolder.id, originalUserId, newUserId);
      }
    }

    return newFolder.id;
  };

  const copyFileToUserFolder = async (file: EnhancedReceivedFile, newUserId: string) => {
    const { error } = await db
      .from('files')
      .insert({
        name: file.name,
        type: file.type,
        size: file.size,
        path: file.path, // Manter o mesmo path do storage
        user_id: newUserId,
        folder_id: null // Colocar na raiz dos arquivos do usuário
      });

    if (error) throw error;
  };

  const deleteSelectedItems = async (selectedItems: string[]) => {
    if (!user || selectedItems.length === 0) return false;

    try {
      const fileShares = receivedItems
        .filter(item => selectedItems.includes(item.id) && !item.is_folder)
        .map(item => item.share_id);

      const folderShares = receivedItems
        .filter(item => selectedItems.includes(item.id) && item.is_folder)
        .map(item => item.share_id);

      if (fileShares.length > 0) {
        await db
          .from('file_shares')
          .delete()
          .in('id', fileShares);
      }

      if (folderShares.length > 0) {
        await db
          .from('folder_shares')
          .delete()
          .in('id', folderShares);
      }

      toast({
        title: "Sucesso",
        description: `${selectedItems.length} item(s) removido(s) dos recebidos`,
        variant: "default"
      });

      fetchReceivedItems();
      return true;
    } catch (error) {
      console.error('Erro ao deletar itens:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover itens",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReceivedItems();
  }, [user, currentSenderFolderId]);

  return {
    receivedItems,
    senderFolders,
    loading,
    currentPath,
    refetch: fetchReceivedItems,
    moveToMyFiles,
    deleteSelectedItems,
    setCurrentPath
  };
};