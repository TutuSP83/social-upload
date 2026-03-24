
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SpecialFolder {
  id: string;
  name: string;
  type: 'received' | 'sent';
  isSpecial: true;
}

export const useSpecialFolders = () => {
  const [specialFolders, setSpecialFolders] = useState<SpecialFolder[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Criar pastas especiais virtuais
      setSpecialFolders([
        {
          id: 'special-received',
          name: 'Recebidos',
          type: 'received',
          isSpecial: true
        },
        {
          id: 'special-sent',
          name: 'Enviados',
          type: 'sent',
          isSpecial: true
        }
      ]);
    }
  }, [user]);

  return { specialFolders };
};
