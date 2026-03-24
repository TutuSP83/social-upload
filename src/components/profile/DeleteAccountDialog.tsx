
import { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const db = supabase as any;

export const DeleteAccountDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR CONTA' || !user) {
      toast({
        title: "Confirmação incorreta",
        description: "Digite exatamente 'EXCLUIR CONTA' para confirmar",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Starting account deletion process for user:', user.id);
      
      // 1. Delete user files from storage
      try {
        const { data: files } = await supabase.storage
          .from('uploads')
          .list(user.id);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          console.log('Deleting files:', filePaths);
          
          const { error: storageError } = await supabase.storage
            .from('uploads')
            .remove(filePaths);
            
          if (storageError) {
            console.error('Error deleting files from storage:', storageError);
          }
        }
      } catch (storageError) {
        console.error('Error accessing storage:', storageError);
      }

      // 2. Delete avatar from storage
      try {
        const { data: avatars } = await supabase.storage
          .from('avatars')
          .list(user.id);

        if (avatars && avatars.length > 0) {
          const avatarPaths = avatars.map(file => `${user.id}/${file.name}`);
          console.log('Deleting avatars:', avatarPaths);
          
          const { error: avatarError } = await supabase.storage
            .from('avatars')
            .remove(avatarPaths);
            
          if (avatarError) {
            console.error('Error deleting avatars from storage:', avatarError);
          }
        }
      } catch (avatarError) {
        console.error('Error accessing avatar storage:', avatarError);
      }

      // 3. Delete user data from database tables
      // The RLS policies and foreign key constraints will handle cascade deletes
      console.log('Deleting user data from database...');
      
      // Delete messages
      const { error: messagesError } = await db
        .from('messages')
        .delete()
        .eq('user_id', user.id);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      }

      // Delete files records
      const { error: filesError } = await db
        .from('files')
        .delete()
        .eq('user_id', user.id);
      
      if (filesError) {
        console.error('Error deleting files records:', filesError);
      }

      // Delete folders
      const { error: foldersError } = await db
        .from('folders')
        .delete()
        .eq('user_id', user.id);
      
      if (foldersError) {
        console.error('Error deleting folders:', foldersError);
      }

      // Delete user roles
      const { error: rolesError } = await db
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (rolesError) {
        console.error('Error deleting user roles:', rolesError);
      }

      // Delete profile
      const { error: profileError } = await db
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      console.log('Database cleanup completed');

      // 4. Show success message before signing out
      toast({
        title: "Conta excluída com sucesso",
        description: "Todos os seus dados foram removidos permanentemente. Você será desconectado em alguns segundos."
      });

      // 5. Sign out user (this will redirect them)
      setTimeout(async () => {
        try {
          await signOut();
          console.log('User signed out successfully');
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
          // Force reload if sign out fails
          window.location.reload();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error in account deletion process:', error);
      toast({
        title: "Erro ao excluir conta",
        description: "Ocorreu um erro durante o processo. Seus dados foram parcialmente removidos. Entre em contato com o suporte se necessário.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setConfirmText('');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Conta Permanentemente
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-red-600 dark:text-red-400">
                Excluir Conta Permanentemente
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              ⚠️ Esta ação não pode ser desfeita!
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                Será excluído permanentemente:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Sua conta de usuário</li>
                <li>• Todos os arquivos enviados</li>
                <li>• Todas as pastas criadas</li>
                <li>• Todas as mensagens do chat</li>
                <li>• Dados do perfil e avatar</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Para confirmar, digite exatamente: <span className="font-bold text-red-600">EXCLUIR CONTA</span>
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite: EXCLUIR CONTA"
                className="border-red-300 focus:border-red-500"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={() => {
              setConfirmText('');
              setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== 'EXCLUIR CONTA' || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
