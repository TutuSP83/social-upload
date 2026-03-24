
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Send } from 'lucide-react';
import { SpecialFolder } from '@/hooks/useSpecialFolders';

interface SpecialFolderCardProps {
  folder: SpecialFolder;
  onNavigate: (folderId: string | null, isSpecial?: boolean, specialType?: 'received' | 'sent') => void;
}

export const SpecialFolderCard = ({ folder, onNavigate }: SpecialFolderCardProps) => {
  const handleClick = () => {
    onNavigate(folder.id, true, folder.type);
  };

  const Icon = folder.type === 'received' ? Inbox : Send;
  const bgColor = folder.type === 'received' ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900';
  const iconColor = folder.type === 'received' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${bgColor} rounded-lg`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {folder.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {folder.type === 'received' ? 'Arquivos recebidos' : 'Arquivos enviados'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
