
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFileSharing } from '@/hooks/useFileSharing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const db = supabase as any;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    user_id: string;
    parent_folder_id?: string | null;
    created_at?: string;
  };
  type: 'file' | 'folder';
}

export const ShareModal = ({ isOpen, onClose, item, type }: ShareModalProps) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const { shareFile, shareFolder, loading } = useFileSharing();
  const { user } = useAuth();

  const checkForDuplicate = async () => {
    if (!user || !email.trim()) return false;

    try {
      // Buscar usuário pelo email
      const { data: profiles } = await db
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (!profiles) return false;

      if (type === 'folder') {
        // Verificar se já existe um compartilhamento desta pasta EXATA
        const { data: existingShare } = await db
          .from('folder_shares')
          .select('id')
          .eq('folder_id', item.id)
          .eq('shared_by', user.id)
          .eq('shared_with', (profiles as any).id)
          .single();

        return !!existingShare;
      } else {
        // Verificar se já existe um compartilhamento deste arquivo EXATO
        const { data: existingShare } = await db
          .from('file_shares')
          .select('id')
          .eq('file_id', item.id)
          .eq('shared_by', user.id)
          .eq('shared_with', (profiles as any).id)
          .single();

        return !!existingShare;
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return false;
    }
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira um email válido",
        variant: "destructive"
      });
      return;
    }

    // Verificar se já foi compartilhado
    const isDuplicate = await checkForDuplicate();
    
    if (isDuplicate) {
      toast({
        title: "Item já compartilhado",
        description: "Este item já foi compartilhado com este usuário.",
        variant: "destructive"
      });
      return;
    }

    let success = false;
    
    if (type === 'folder') {
      success = await shareFolder(item.id, email.trim(), permission);
    } else {
      success = await shareFile(item.id, email.trim(), permission);
    }

    if (success) {
      setEmail('');
      setPermission('view');
      onClose();
    }
  };

  const handleClose = () => {
    setEmail('');
    setPermission('view');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Compartilhar {type === 'file' ? 'arquivo' : 'pasta'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="item-name">Nome do item</Label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {item.name}
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email do destinatário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div>
            <Label htmlFor="permission">Permissão</Label>
            <Select value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Apenas visualizar</SelectItem>
                <SelectItem value="edit">Visualizar e editar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleShare} disabled={loading || !email.trim()}>
            {loading ? 'Compartilhando...' : 'Compartilhar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
