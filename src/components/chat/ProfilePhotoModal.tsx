
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
  socialName: string;
}

export const ProfilePhotoModal = ({ 
  isOpen, 
  onClose, 
  avatarUrl, 
  socialName 
}: ProfilePhotoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-0 bg-transparent border-none shadow-none">
        <div className="relative">
          <DialogClose className="absolute -top-10 right-0 z-10 text-white hover:text-gray-300 transition-colors">
            <X className="h-6 w-6" />
          </DialogClose>
          
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-80 w-80 border-4 border-white shadow-2xl">
              <AvatarImage 
                src={avatarUrl || ''} 
                alt={`Foto de perfil de ${socialName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-6xl font-bold">
                {socialName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="text-white text-xl font-semibold text-center">
              {socialName}
            </h3>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
