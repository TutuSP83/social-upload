
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnlineUser {
  user_id: string;
  social_name: string;
  avatar_url?: string;
  online_at: string;
}

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const presenceRef = useRef<NodeJS.Timeout>();
  const fetchRef = useRef<NodeJS.Timeout>();

  const updatePresence = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      setIsOnline(true);
      console.log('Presence updated for user:', user.id);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const fetchOnlineUsers = async () => {
    if (!user) return;

    try {
      // Get users who were online in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, last_seen, status')
        .eq('status', 'online')
        .gte('last_seen', fiveMinutesAgo);

      if (presenceError) {
        console.error('Error fetching presence:', presenceError);
        return;
      }

      if (!presenceData || presenceData.length === 0) {
        setOnlineUsers([]);
        return;
      }

      const userIds = presenceData.map(p => p.user_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, social_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching online user profiles:', profilesError);
        return;
      }

      const onlineUsersData: OnlineUser[] = presenceData.map(presence => {
        const profile = profilesData?.find(p => p.id === presence.user_id);
        return {
          user_id: presence.user_id,
          social_name: profile?.social_name || 'Usuário',
          avatar_url: profile?.avatar_url,
          online_at: presence.last_seen
        };
      });

      setOnlineUsers(onlineUsersData);
      console.log('Online users updated:', onlineUsersData.length);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const setOffline = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      setIsOnline(false);
      console.log('User set to offline:', user.id);
    } catch (error) {
      console.error('Error setting offline:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial presence update
    updatePresence();
    fetchOnlineUsers();

    // Set up intervals
    presenceRef.current = setInterval(updatePresence, 30000); // Update every 30 seconds
    fetchRef.current = setInterval(fetchOnlineUsers, 15000); // Fetch every 15 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        updatePresence();
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (presenceRef.current) clearInterval(presenceRef.current);
      if (fetchRef.current) clearInterval(fetchRef.current);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      setOffline();
    };
  }, [user]);

  return {
    onlineUsers,
    isOnline,
    updatePresence,
    setOffline
  };
};
