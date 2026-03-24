
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Temporary untyped Notification types until backend types are available
type Notification = any;
type NotificationInsert = any;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        console.log('Cleaning up existing notifications subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Create new subscription only if we don't have one
      console.log('Setting up notifications subscription for user:', user.id);
      
      try {
        const subscription = supabase
          .channel(`notifications_${user.id}_${Date.now()}`) // Unique channel name
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            () => {
              console.log('Notification change detected, refreshing...');
              fetchNotifications();
            }
          )
          .subscribe((status) => {
            console.log('Notifications subscription status:', status);
          });

        subscriptionRef.current = subscription;
      } catch (error) {
        console.error('Error setting up notifications subscription:', error);
      }

      return () => {
        console.log('Cleaning up notifications subscription');
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    } else {
      // Clean up subscription when user logs out
      if (subscriptionRef.current) {
        console.log('User logged out, cleaning up notifications subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-subscriptions

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const db = supabase as any;
      const { data, error } = await db
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const db = supabase as any;
      const { error } = await db
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const db = supabase as any;
      const { error } = await db
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const createNotification = async (notification: Omit<NotificationInsert, 'user_id'>) => {
    if (!user) return;

    try {
      const db = supabase as any;
      const { error } = await db
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
};
