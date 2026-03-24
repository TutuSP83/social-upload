
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

interface User {
  id: string;
  social_name: string;
  email: string;
}

interface EnhancedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'file' | 'folder';
}

export const EnhancedShareModal = ({ isOpen, onClose, item, type }: EnhancedShareModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const { user: currentUser } = useAuth();

  console.log('EnhancedShareModal - isOpen:', isOpen, 'item:', item, 'type:', type);

  const fetchUsers = async () => {
    if (!currentUser) {
      console.log('Nenhum usuário logado');
      return;
    }

    try {
      setLoading(true);
      console.log('Buscando usuários...');
      
      const { data, error } = await db
        .from('profiles')
        .select('id, social_name, email')
        .neq('id', currentUser.id)
        .order('social_name');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        toast({
          title: "Erro ao carregar usuários",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Usuários encontrados:', data?.length || 0);
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser && showUserList) {
      console.log('Modal aberto e lista solicitada, buscando usuários...');
      fetchUsers();
    }
  }, [isOpen, currentUser, showUserList]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.social_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const shareWithRecursiveFunction = async (folderId: string, userId: string, senderFolderId: string) => {
    try {
      // Compartilhar a pasta atual
      await db
        .from('folder_shares')
        .insert({
          folder_id: folderId,
          shared_by: currentUser!.id,
          shared_with: userId,
          permission: 'view',
          sender_folder_id: senderFolderId
        });

      // Buscar e compartilhar todos os arquivos da pasta
      const { data: folderFiles } = await db
        .from('files')
        .select('id')
        .eq('folder_id', folderId)
        .eq('user_id', currentUser!.id);

      if (folderFiles && folderFiles.length > 0) {
        for (const file of folderFiles) {
          await db
            .from('file_shares')
            .insert({
              file_id: (file as any).id,
              shared_by: currentUser!.id,
              shared_with: userId,
              permission: 'view',
              sender_folder_id: senderFolderId
            });
        }
      }

      // Buscar subpastas e compartilhá-las recursivamente
      const { data: subfolders } = await db
        .from('folders')
        .select('id')
        .eq('parent_folder_id', folderId)
        .eq('user_id', currentUser!.id);

      if (subfolders && subfolders.length > 0) {
        for (const subfolder of subfolders) {
          await shareWithRecursiveFunction((subfolder as any).id, userId, senderFolderId);
        }
      }
    } catch (error) {
      console.error('Erro no compartilhamento recursivo:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "Nenhum usuário selecionado",
        description: "Selecione pelo menos um usuário para compartilhar",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser || !item) {
      console.log('Dados insuficientes para compartilhar:', { currentUser: !!currentUser, item: !!item });
      return;
    }

    try {
      setSharing(true);
      let successCount = 0;
      let errorCount = 0;

      console.log('Iniciando compartilhamento para', selectedUsers.size, 'usuários');

      for (const userId of selectedUsers) {
        try {
          console.log('Compartilhando com usuário:', userId);
          
          // Usar a função segura para criar pasta do remetente
          const { data: senderFolderId, error: folderError } = await db
            .rpc('create_sender_folder_safe', {
              p_shared_with: userId,
              p_shared_by: currentUser.id
            });

          if (folderError || !senderFolderId) {
            console.error('Falha ao criar pasta do remetente para:', userId, folderError);
            errorCount++;
            continue;
          }

          if (type === 'file') {
            console.log('Compartilhando arquivo:', item.id);
            const { error } = await db
              .from('file_shares')
              .insert({
                file_id: item.id,
                shared_by: currentUser.id,
                shared_with: userId,
                permission: 'view',
                sender_folder_id: senderFolderId
              });

            if (error && error.code !== '23505') { // Ignorar erro de duplicata
              console.error('Erro ao compartilhar arquivo:', error);
              errorCount++;
              continue;
            }
          } else if (type === 'folder') {
            console.log('Compartilhando pasta recursivamente:', item.id);
            await shareWithRecursiveFunction(item.id, userId, senderFolderId);
          }

          console.log('Compartilhamento bem-sucedido com:', userId);
          successCount++;
        } catch (error) {
          console.error('Erro ao compartilhar com usuário:', userId, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Compartilhamento realizado",
          description: `${type === 'file' ? 'Arquivo' : 'Pasta'} compartilhado com ${successCount} usuário(s)${type === 'folder' ? ' (incluindo todos os arquivos)' : ''}`
        });
      }

      if (errorCount > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: `Falha ao compartilhar com ${errorCount} usuário(s)`,
          variant: "destructive"
        });
      }

      setSelectedUsers(new Set());
      setShowUserList(false);
      onClose();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao compartilhar",
        variant: "destructive"
      });
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers(new Set());
    setSearchTerm('');
    setShowUserList(false);
    onClose();
  };

  if (!isOpen || !item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Compartilhar {type === 'file' ? 'Arquivo' : 'Pasta'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              {type === 'file' ? 'Arquivo' : 'Pasta'}: <span className="text-purple-600">{item?.name || 'Sem nome'}</span>
            </Label>
            {type === 'folder' && (
              <p className="text-xs text-gray-500 mt-1">
                Todos os arquivos e subpastas serão compartilhados
              </p>
            )}
          </div>

          {!showUserList ? (
            <div className="text-center py-8">
              <Button
                onClick={() => setShowUserList(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Selecionar Usuários
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="search">Buscar usuários</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite o nome ou email do usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {selectedUsers.size > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Usuários selecionados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedUsers).map(userId => {
                      const user = users.find(u => u.id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                          {user?.social_name || 'Usuário'}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => toggleUserSelection(userId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <Label className="text-sm font-medium">
                  Usuários disponíveis ({filteredUsers.length})
                </Label>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando usuários...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUsers.has(user.id)
                            ? 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.social_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.social_name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {selectedUsers.has(user.id) ? (
                            <UserPlus className="h-4 w-4 text-purple-600" />
                          ) : (
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {showUserList && (
              <Button 
                onClick={handleShare}
                disabled={selectedUsers.size === 0 || sharing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sharing ? 'Compartilhando...' : `Compartilhar (${selectedUsers.size})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
