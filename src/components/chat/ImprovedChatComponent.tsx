
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import { 
  Send, 
  MessageCircle, 
  Smile,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmojiPicker } from './EmojiPicker';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    social_name: string;
    avatar_url?: string;
  } | null;
}

interface OnlineUser {
  user_id: string;
  social_name: string;
  avatar_url?: string;
  last_seen: string;
}

export const ImprovedChatComponent = () => {
  const db = supabase as any;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedUserPhoto, setSelectedUserPhoto] = useState<{
    avatarUrl?: string;
    socialName: string;
  } | null>(null);
  
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    updateUserPresence();
    
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    // Atualizar presença a cada 30 segundos
    const presenceInterval = setInterval(updateUserPresence, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceInterval);
    };
  }, [user]);

  const updateUserPresence = async () => {
    if (!user) return;
    
    try {
      await db
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      fetchOnlineUsers();
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Primeiro buscar usuários online
      const { data: presenceData, error: presenceError } = await db
        .from('user_presence')
        .select('user_id, last_seen')
        .gte('last_seen', fiveMinutesAgo)
        .eq('status', 'online');

      if (presenceError) throw presenceError;

      if (!presenceData || presenceData.length === 0) {
        setOnlineUsers([]);
        return;
      }

      // Buscar perfis dos usuários online
      const userIds = presenceData.map(p => p.user_id);
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, social_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados de presença com perfis
      const users = presenceData.map(presence => {
        const profile = profilesData?.find(p => p.id === presence.user_id);
        return {
          user_id: presence.user_id,
          social_name: profile?.social_name || 'Usuário',
          avatar_url: profile?.avatar_url,
          last_seen: presence.last_seen,
        };
      });

      setOnlineUsers(users);
    } catch (error) {
      console.error('Erro ao buscar usuários online:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Buscar mensagens
      const { data: messagesData, error: messagesError } = await db
        .from('messages')
        .select('id, content, user_id, created_at')
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Buscar perfis dos usuários que enviaram mensagens
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, social_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
      }

      // Combinar mensagens com perfis
      const messagesWithProfiles = messagesData.map(message => ({
        ...message,
        profiles: profilesData?.find(p => p.id === message.user_id) || null,
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        description: 'Tente recarregar a página',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      
      const { error } = await db
        .from('messages')
        .insert({
          content: newMessage.trim(),
          user_id: user.id
        });

      if (error) throw error;

      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleAvatarClick = (avatarUrl?: string, socialName?: string) => {
    if (avatarUrl && socialName) {
      setSelectedUserPhoto({ avatarUrl, socialName });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-sm">Carregando chat...</span>
      </div>
    );
  }

  return (
    <>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="py-4 px-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-xl">Chat Global</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Badge variant="outline" className="text-sm">
                {onlineUsers.length} online
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex p-0 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isOwn = message.user_id === user?.id;
                    const socialName = message.profiles?.social_name || 'Usuário';
                    const avatarUrl = message.profiles?.avatar_url;
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start gap-3 ${
                          isOwn ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleAvatarClick(avatarUrl, socialName)}
                        >
                          <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white shadow-sm">
                            <AvatarImage 
                              src={avatarUrl} 
                              alt={socialName}
                            />
                            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                              {socialName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className={`max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-sm font-medium text-foreground">
                              {isOwn ? 'Você' : socialName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                          
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm break-words ${
                              isOwn
                                ? 'bg-purple-600 text-white rounded-br-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-foreground border rounded-bl-sm'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-card p-4">
              <div className="flex items-center gap-3">
                {/* Emoji Button */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-10 w-10 p-0"
                    title="Adicionar emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 z-50"
                      >
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="text-sm"
                    disabled={sending}
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700"
                  title="Enviar mensagem"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar with Online Users */}
          {!isMobile && (
            <div className="w-64 border-l bg-gray-50 dark:bg-gray-900">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Usuários Online ({onlineUsers.length})
                </h3>
                <div className="space-y-2">
                  {onlineUsers.map((onlineUser) => (
                    <div 
                      key={onlineUser.user_id} 
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleAvatarClick(onlineUser.avatar_url, onlineUser.social_name)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={onlineUser.avatar_url} 
                          alt={onlineUser.social_name}
                        />
                        <AvatarFallback className="text-xs bg-green-500 text-white">
                          {onlineUser.social_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {onlineUser.social_name}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {onlineUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum usuário online
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUserPhoto && (
        <ProfilePhotoModal
          isOpen={!!selectedUserPhoto}
          onClose={() => setSelectedUserPhoto(null)}
          avatarUrl={selectedUserPhoto.avatarUrl}
          socialName={selectedUserPhoto.socialName}
        />
      )}
    </>
  );
};
