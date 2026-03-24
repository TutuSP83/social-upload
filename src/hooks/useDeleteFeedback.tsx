
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';

export const useDeleteFeedback = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;

  const deleteFeedback = async (feedbackId: string, feedbackUserId?: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para excluir feedback",
        variant: "destructive"
      });
      return false;
    }

    console.log('=== DEBUG EXCLUSÃO FEEDBACK ===');
    console.log('Feedback ID:', feedbackId);
    console.log('Feedback User ID:', feedbackUserId);
    console.log('Current User ID:', user.id);
    console.log('Is Admin:', isAdmin);
    console.log('Can Delete:', isAdmin || user.id === feedbackUserId);

    setLoading(true);
    try {
      const { error } = await db
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) {
        console.error('=== ERRO SUPABASE ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      console.log('=== EXCLUSÃO REALIZADA COM SUCESSO ===');
      toast({
        title: "Feedback excluído!",
        description: "O feedback foi excluído com sucesso.",
      });
      
      return true;
    } catch (error: any) {
      console.error('=== ERRO NA EXCLUSÃO ===');
      console.error('Error object:', error);
      
      // Verificar se é erro de permissão RLS
      if (error.code === 'PGRST301' || error.message?.includes('row-level security') || error.message?.includes('insufficient_privilege')) {
        toast({
          title: "Erro de permissão",
          description: "Você não tem permissão para excluir este feedback",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao excluir feedback",
          description: error.message || "Tente novamente em alguns minutos",
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteFeedback,
    loading
  };
};
