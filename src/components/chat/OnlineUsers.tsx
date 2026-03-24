
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnlineUser {
  user_id: string;
  social_name: string;
  avatar_url?: string;
  online_at: string;
}

interface OnlineUsersProps {
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export const OnlineUsers = ({ onlineUsers, onlineCount }: OnlineUsersProps) => {
  const [showUsersList, setShowUsersList] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative">
      <motion.div
        className={`flex items-center gap-2 cursor-pointer ${
          isMobile ? 'text-xs' : 'text-sm'
        } opacity-90 hover:opacity-100 transition-opacity`}
        onClick={() => setShowUsersList(!showUsersList)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Users className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span>{onlineCount} online</span>
        <Circle className={`${isMobile ? 'h-2 w-2' : 'h-2.5 w-2.5'} fill-green-400 text-green-400 animate-pulse`} />
      </motion.div>

      <AnimatePresence>
        {showUsersList && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-50 ${
              isMobile ? 'w-48' : 'w-64'
            }`}
          >
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Usuários Online
                </h4>
                <Badge variant="secondary" className={isMobile ? 'text-xs' : 'text-sm'}>
                  {onlineCount}
                </Badge>
              </div>
              
              <div className={`space-y-${isMobile ? '2' : '3'} max-h-48 overflow-y-auto`}>
                {onlineUsers.length === 0 ? (
                  <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Nenhum usuário online
                  </p>
                ) : (
                  onlineUsers.map((user) => (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="relative">
                        <Avatar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'}`}>
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-xs">
                            {user.social_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-400 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>
                          {user.social_name}
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                          Online agora
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
