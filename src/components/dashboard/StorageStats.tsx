
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStorageStats } from '@/hooks/useStorageStats';
import { HardDrive, Database, FolderOpen } from 'lucide-react';

export const StorageStats = () => {
  const { stats, loading } = useStorageStats();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-blue-600" />
          Armazenamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Espaço Utilizado</span>
          <span className="text-sm text-gray-600">
            {formatBytes(stats?.total_used || 0)} de {formatBytes(stats?.total_limit || 5368709120)}
          </span>
        </div>
        
        <Progress value={stats?.usage_percentage || 0} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Disponível</p>
              <p className="text-sm font-semibold text-green-600">
                {formatBytes(stats?.storage_available || 0)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Usado</p>
              <p className="text-sm font-semibold text-orange-600">
                {stats?.usage_percentage?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
