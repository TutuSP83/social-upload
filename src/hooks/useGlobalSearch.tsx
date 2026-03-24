
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type SearchResult = {
  type: 'file' | 'message' | 'feedback';
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_name?: string;
};

export const useGlobalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const search = async (query: string) => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Buscar arquivos
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .limit(10);

      if (files) {
        files.forEach(file => {
          searchResults.push({
            type: 'file',
            id: file.id,
            title: file.name,
            content: `Arquivo ${file.type || 'unknown'} • ${file.size ? Math.round(file.size / 1024) + ' KB' : 'Tamanho desconhecido'}`,
            created_at: file.uploaded_at || file.name
          });
        });
      }

      // Buscar mensagens
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(social_name)
        `)
        .ilike('content', `%${query}%`)
        .limit(10);

      if (messages) {
        messages.forEach((message: any) => {
          searchResults.push({
            type: 'message',
            id: message.id,
            title: `Mensagem de ${message.profiles?.social_name || 'Usuário'}`,
            content: message.content,
            created_at: message.created_at,
            user_name: message.profiles?.social_name
          });
        });
      }

      // Buscar feedbacks
      const { data: feedbacks } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles!inner(social_name)
        `)
        .ilike('feedback_text', `%${query}%`)
        .limit(10);

      if (feedbacks) {
        feedbacks.forEach((feedback: any) => {
          searchResults.push({
            type: 'feedback',
            id: feedback.id,
            title: `Feedback: ${feedback.feedback_type}`,
            content: feedback.feedback_text,
            created_at: feedback.created_at,
            user_name: feedback.profiles?.social_name
          });
        });
      }

      // Ordenar por data
      searchResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    search
  };
};
