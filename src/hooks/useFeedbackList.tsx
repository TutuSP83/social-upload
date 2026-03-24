
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Temporary untyped types until backend types are available
type FeedbackRow = any;

type FeedbackWithProfile = FeedbackRow & {
  profile?: {
    social_name: string;
  };
};

export const useFeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      const db = supabase as any;

      console.log('Iniciando busca de feedbacks...');
      setLoading(true);
      
      const { data: feedbackData, error: feedbackError } = await db
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error('Erro ao buscar feedbacks:', feedbackError);
        setFeedbacks([]);
        return;
      }

      console.log('Feedbacks encontrados:', feedbackData?.length || 0);

      if (!feedbackData || feedbackData.length === 0) {
        setFeedbacks([]);
        return;
      }

      // Buscar perfis
      const userIds = (feedbackData as any[]).map((feedback) => feedback.user_id);
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, social_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
      }

      console.log('Perfis encontrados:', profilesData?.length || 0);
      
      // Combinar dados
      const combinedData = (feedbackData as any[]).map((feedback) => {
        const profile = (profilesData as any[] | undefined)?.find((p) => p.id === feedback.user_id);
        return {
          ...(feedback as any),
          profile: profile ? { social_name: profile.social_name } : undefined
        };
      });
      
      console.log('Feedbacks com perfis combinados:', combinedData.length);
      setFeedbacks(combinedData);
    } catch (error) {
      console.error('Erro inesperado ao buscar feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return {
    feedbacks,
    loading,
    refetch: fetchFeedbacks
  };
};
