
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserStats {
  total_files: number;
  total_storage_used: number;
  total_messages: number;
  total_feedbacks: number;
  last_activity: string;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching user stats for:', user.id);
      setLoading(true);

      // Fetch user stats
      const { data: userStatsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch real-time data
      const [filesData, messagesData, feedbackData] = await Promise.all([
        supabase
          .from('files')
          .select('size')
          .eq('user_id', user.id),
        supabase
          .from('messages')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('feedback')
          .select('id')
          .eq('user_id', user.id)
      ]);

      const totalFiles = filesData.data?.length || 0;
      const totalStorageUsed = filesData.data?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
      const totalMessages = messagesData.data?.length || 0;
      const totalFeedbacks = feedbackData.data?.length || 0;

      // Update user_stats table
      const { data: updatedStats } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          total_files: totalFiles,
          total_storage_used: totalStorageUsed,
          total_messages: totalMessages,
          total_feedbacks: totalFeedbacks,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const stats: UserStats = {
        total_files: totalFiles,
        total_storage_used: totalStorageUsed,
        total_messages: totalMessages,
        total_feedbacks: totalFeedbacks,
        last_activity: updatedStats?.last_activity || new Date().toISOString()
      };

      console.log('User stats loaded:', stats);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      
      // Fallback stats
      setStats({
        total_files: 0,
        total_storage_used: 0,
        total_messages: 0,
        total_feedbacks: 0,
        last_activity: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};
