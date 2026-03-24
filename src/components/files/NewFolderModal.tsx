
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<boolean>;
}

export const NewFolderModal = ({ isOpen, onClose, onCreate }: NewFolderModalProps) => {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      setLoading(true);
      const success = await onCreate(folderName.trim());
      setLoading(false);
      
      if (success) {
        setFolderName('');
        onClose();
      }
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folderName">Nome da Pasta</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
              autoFocus
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!folderName.trim() || loading}>
              {loading ? 'Criando...' : 'Criar Pasta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
