
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StorageStats {
  total_used: number;
  total_limit: number;
  storage_available: number;
  usage_percentage: number;
}

export const useStorageStats = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStorageStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching storage stats for:', user.id);
      
      const { data, error } = await supabase
        .rpc('calculate_storage_stats', { user_uuid: user.id });

      if (error) {
        console.error('Error fetching storage stats:', error);
        return;
      }

      if (data && data.length > 0) {
        const storageData = data[0];
        const stats: StorageStats = {
          total_used: storageData.total_used || 0,
          total_limit: storageData.total_limit || 10737418240,
          storage_available: storageData.available || 10737418240,
          usage_percentage: ((storageData.total_used || 0) / (storageData.total_limit || 10737418240)) * 100
        };
        
        console.log('Storage stats loaded:', stats);
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStorageStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStorageStats
  };
};
