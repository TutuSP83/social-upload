
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useNewFeedback = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const submitFeedback = async (feedback: string, type: 'bug' | 'suggestion' | 'compliment' | 'other') => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar feedback",
        variant: "destructive"
      });
      return false;
    }

    if (!feedback.trim()) {
      toast({
        title: "Erro",
        description: "O feedback não pode estar vazio",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Enviando feedback:', { user_id: user.id, feedback, type });
      
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          feedback_text: feedback.trim(),
          feedback_type: type,
          user_email: user.email || null
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir feedback:', error);
        toast({
          title: "Erro ao enviar feedback",
          description: "Tente novamente em alguns minutos",
          variant: "destructive"
        });
        return false;
      }

      console.log('Feedback enviado com sucesso:', data);
      toast({
        title: "Feedback enviado!",
        description: "Obrigado pelo seu feedback. Ele é muito importante para nós!",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Erro inesperado. Tente novamente em alguns minutos",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitFeedback,
    loading
  };
};
