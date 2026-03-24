
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

interface FolderPath {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
}

export const FolderBreadcrumb = ({ currentFolderId, onNavigate }: FolderBreadcrumbProps) => {
  const [path, setPath] = useState<FolderPath[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const buildPath = async (folderId: string | null) => {
    if (!folderId || !user) {
      setPath([]);
      return;
    }

    setLoading(true);
    try {
      const breadcrumb: FolderPath[] = [];
      let currentId = folderId;

      while (currentId) {
        const { data: folder, error } = await db
          .from('folders')
          .select('id, name, parent_folder_id')
          .eq('id', currentId)
          .eq('user_id', user.id)
          .single();

        if (error || !folder) break;

        breadcrumb.unshift({ id: (folder as any).id, name: (folder as any).name });
        currentId = (folder as any).parent_folder_id;
      }

      setPath(breadcrumb);
    } catch (error) {
      console.error('Erro ao construir breadcrumb:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildPath(currentFolderId);
  }, [currentFolderId, user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </Button>

      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className="hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
          >
            {folder.name}
          </Button>
        </div>
      ))}
    </div>
  );
};
