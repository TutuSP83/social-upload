
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus, Upload, FileText, Search } from 'lucide-react';

interface EmptyStateProps {
  searchTerm?: string;
  onCreateFolder: () => void;
}

export const EmptyState = ({ searchTerm, onCreateFolder }: EmptyStateProps) => {
  if (searchTerm) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            Não foram encontrados arquivos ou pastas para "{searchTerm}"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex items-center gap-4 mb-6">
          <FileText className="h-12 w-12 text-gray-400" />
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
          <FolderPlus className="h-12 w-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Nenhum arquivo ou pasta encontrado
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Comece criando uma nova pasta ou fazendo upload de arquivos
        </p>
        
        <div className="flex gap-3">
          <Button
            onClick={onCreateFolder}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            Criar Pasta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
