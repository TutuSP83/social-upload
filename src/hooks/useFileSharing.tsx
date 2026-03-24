
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useFileSharing = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;


  const shareFile = async (fileId: string, sharedWithEmail: string, permission: 'view' | 'edit') => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para compartilhar arquivos",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Iniciando compartilhamento de arquivo:', fileId, 'com:', sharedWithEmail);

      // Buscar o usuário destinatário pelo email
      const { data: profiles, error: profileError } = await db
        .from('profiles')
        .select('id, social_name, email')
        .eq('email', sharedWithEmail.toLowerCase().trim())
        .single();

      if (profileError || !profiles) {
        console.error('Usuário não encontrado:', profileError);
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar um usuário com este email",
          variant: "destructive"
        });
        return false;
      }

      console.log('Usuário encontrado:', profiles.id);

      // Verificar se o arquivo existe e pertence ao usuário
      const { data: fileData, error: fileError } = await db
        .from('files')
        .select('id, name, user_id')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single();

      if (fileError || !fileData) {
        console.error('Arquivo não encontrado ou não pertence ao usuário:', fileError);
        toast({
          title: "Erro",
          description: "Arquivo não encontrado ou você não tem permission para compartilhá-lo",
          variant: "destructive"
        });
        return false;
      }

      // Compartilhar o arquivo (permitir múltiplos compartilhamentos)
      const { error: shareError } = await db
        .from('file_shares')
        .insert({
          file_id: fileId,
          shared_by: user.id,
          shared_with: (profiles as any).id,
          permission: permission
        });

      if (shareError && shareError.code === '23505') {
        toast({
          title: "Arquivo já compartilhado",
          description: "Este arquivo já foi compartilhado com este usuário",
        });
        return false;
      } else if (shareError) {
        console.error('Erro ao compartilhar arquivo:', shareError);
        toast({
          title: "Erro ao compartilhar",
          description: shareError.message || "Não foi possível compartilhar o arquivo",
          variant: "destructive"
        });
        return false;
      }

      console.log('Arquivo compartilhado com sucesso');
      toast({
        title: "Arquivo compartilhado!",
        description: `Arquivo "${fileData.name}" compartilhado com ${sharedWithEmail} com sucesso`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Tente novamente em alguns minutos",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const shareFolder = async (folderId: string, sharedWithEmail: string, permission: 'view' | 'edit') => {
    if (!user) {
      toast({
        title: "Erro", 
        description: "Você precisa estar logado para compartilhar pastas",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Iniciando compartilhamento de pasta:', folderId, 'com:', sharedWithEmail);

      // Buscar o usuário destinatário pelo email
      const { data: profiles, error: profileError } = await db
        .from('profiles')
        .select('id, social_name, email')
        .eq('email', sharedWithEmail.toLowerCase().trim())
        .single();

      if (profileError || !profiles) {
        console.error('Usuário não encontrado:', profileError);
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar um usuário com este email",
          variant: "destructive"
        });
        return false;
      }

      console.log('Usuário encontrado:', profiles.id);

      // Verificar se a pasta existe e pertence ao usuário
      const { data: folderData, error: folderError } = await db
        .from('folders')
        .select('id, name, user_id')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();

      if (folderError || !folderData) {
        console.error('Pasta não encontrada ou não pertence ao usuário:', folderError);
        toast({
          title: "Erro",
          description: "Pasta não encontrada ou você não tem permissão para compartilhá-la",
          variant: "destructive"
        });
        return false;
      }

      // Função recursiva para compartilhar pasta e todo seu conteúdo
      const shareFolderRecursively = async (currentFolderId: string) => {
        console.log('Compartilhando pasta recursivamente:', currentFolderId);

        try {
          // 1. Sempre compartilhar a pasta atual (permitir múltiplos compartilhamentos)
            const { error: folderShareError } = await db
              .from('folder_shares')
              .insert({
                folder_id: currentFolderId,
                shared_by: user.id,
                shared_with: (profiles as any).id,
                permission: permission
              });

          if (folderShareError && folderShareError.code !== '23505') {
            console.error('Erro ao compartilhar pasta:', folderShareError);
            throw folderShareError;
          } else if (folderShareError?.code === '23505') {
            console.log('Pasta já compartilhada, continuando...');
          }

          // 2. Buscar e compartilhar TODOS os arquivos da pasta atual
            const { data: folderFiles, error: filesError } = await db
              .from('files')
              .select('id, name')
              .eq('folder_id', currentFolderId)
              .eq('user_id', user.id);

          if (filesError) {
            console.error('Erro ao buscar arquivos da pasta:', filesError);
            throw filesError;
          }

          if (folderFiles && folderFiles.length > 0) {
            console.log(`Compartilhando ${folderFiles.length} arquivo(s) da pasta ${currentFolderId}`);
            
            // Compartilhar TODOS os arquivos individualmente (permitir múltiplos compartilhamentos)
            for (const file of folderFiles) {
              try {
                  const { error: fileShareError } = await db
                    .from('file_shares')
                    .insert({
                      file_id: file.id,
                      shared_by: user.id,
                      shared_with: (profiles as any).id,
                      permission: permission
                    });

                if (fileShareError && fileShareError.code !== '23505') {
                  console.error('Erro ao compartilhar arquivo:', file.name, fileShareError);
                  // Continuar com outros arquivos mesmo se um falhar
                } else if (fileShareError?.code === '23505') {
                  console.log('Arquivo já compartilhado:', file.name);
                } else {
                  console.log('Arquivo compartilhado:', file.name);
                }
              } catch (fileError) {
                console.error('Erro inesperado ao compartilhar arquivo:', file.name, fileError);
              }
            }
          }

          // 3. Buscar subpastas e compartilhá-las recursivamente
            const { data: subfolders, error: subfoldersError } = await db
              .from('folders')
              .select('id, name')
              .eq('parent_folder_id', currentFolderId)
              .eq('user_id', user.id);

          if (subfoldersError) {
            console.error('Erro ao buscar subpastas:', subfoldersError);
            throw subfoldersError;
          }

          if (subfolders && subfolders.length > 0) {
            console.log(`Compartilhando ${subfolders.length} subpasta(s) da pasta ${currentFolderId}`);
            
            // Compartilhar cada subpasta recursivamente
            for (const subfolder of subfolders) {
              await shareFolderRecursively(subfolder.id);
            }
          }
        } catch (error) {
          console.error('Erro na função recursiva:', error);
          throw error;
        }
      };

      // Executar o compartilhamento recursivo
      await shareFolderRecursively(folderId);

      console.log('Pasta e todo seu conteúdo compartilhados com sucesso');
      toast({
        title: "Pasta compartilhada!",
        description: `Pasta "${folderData.name}" e todo seu conteúdo compartilhado com ${sharedWithEmail} com sucesso`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro inesperado ao compartilhar pasta:', error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Tente novamente em alguns minutos",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    shareFile,
    shareFolder,
    loading
  };
};
