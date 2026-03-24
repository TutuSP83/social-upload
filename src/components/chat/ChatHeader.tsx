
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { OnlineUsers } from './OnlineUsers';

interface OnlineUser {
  user_id: string;
  social_name: string;
  avatar_url?: string;
  online_at: string;
}

interface ChatHeaderProps {
  messageCount: number;
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export const ChatHeader = ({ messageCount, onlineUsers, onlineCount }: ChatHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <CardHeader className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg ${
      isMobile ? 'p-3' : 'p-4'
    } flex-shrink-0`}>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>Chat em Tempo Real</h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
              {messageCount} mensagens
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <OnlineUsers onlineUsers={onlineUsers} onlineCount={onlineCount} />
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
            <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            {format(new Date(), 'HH:mm', { locale: ptBR })}
          </div>
        </div>
      </CardTitle>
    </CardHeader>
  );
};
