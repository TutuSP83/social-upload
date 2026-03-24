
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePresenceManager = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const presenceIntervalRef = useRef<NodeJS.Timeout>();

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
      console.log('Presence updated successfully');
    } catch (error) {
      console.error('Error updating presence:', error);
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
      console.log('User set to offline');
    } catch (error) {
      console.error('Error setting offline:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial presence update
    updatePresence();

    // Set up interval to update presence every 30 seconds
    presenceIntervalRef.current = setInterval(updatePresence, 30000);

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
      navigator.sendBeacon('/api/presence-offline', JSON.stringify({ user_id: user.id }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      setOffline();
    };
  }, [user]);

  return {
    isOnline,
    updatePresence,
    setOffline
  };
};
