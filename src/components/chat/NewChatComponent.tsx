import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Send, 
  Users, 
  MessageCircle, 
  Smile,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmojiPicker } from './EmojiPicker';
import { OnlineUsers } from './OnlineUsers';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    social_name: string;
    avatar_url?: string;
  };
}

interface OnlineUser {
  user_id: string;
  social_name: string;
  avatar_url?: string;
  online_at: string;
}

export const NewChatComponent = () => {
  const db = supabase as any;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await db
        .from('messages')
        .select('id, content, user_id, created_at')
        .order('created_at', { ascending: true })
        .limit(50);

      if (messagesError) throw messagesError;

      // Then get profiles for the users who sent messages
      const userIds = [...new Set(messagesData?.map(msg => msg.user_id) || [])];

      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, social_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.id, profile]) || []
      );

      // Combine messages with user profiles
      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        content: msg.content,
        user_id: msg.user_id,
        created_at: msg.created_at,
        user: profilesMap.get(msg.user_id)
          ? {
              social_name: (profilesMap.get(msg.user_id) as any)?.social_name,
              avatar_url: (profilesMap.get(msg.user_id) as any)?.avatar_url,
            }
          : undefined,
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return;

    try {
      setLoading(true);
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
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Componente do chat em tela cheia para mobile
  if (isMobile && isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Chat Geral
            </h2>
            <Badge variant="outline" className="text-xs">
              {onlineUsers.length} online
            </Badge>
          </div>
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.user_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.user_id !== user?.id && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {message.user?.social_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] ${
                    message.user_id === user?.id ? 'text-right' : 'text-left'
                  }`}>
                    {message.user_id !== user?.id && (
                      <div className="text-xs text-gray-500 mb-1">
                        {message.user?.social_name || 'Usuário'}
                      </div>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 text-sm ${
                      message.user_id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      {message.content}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </div>
                  </div>

                  {message.user_id === user?.id && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-blue-600 text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="pr-10"
                disabled={loading}
              />
              <Button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              size="sm"
              className="h-9 w-9 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-16 right-4 z-10">
              <EmojiPicker onEmojiSelect={addEmoji} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout normal para desktop e mobile minimizado
  return (
    <Card className={`${isMobile ? 'h-96' : 'h-[600px]'} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Chat Geral
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {onlineUsers.length} online
            </Badge>
          </div>
          
          {isMobile && (
            <Button
              onClick={toggleFullscreen}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${
                        message.user_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.user_id !== user?.id && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.user?.social_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${
                        message.user_id === user?.id ? 'text-right' : 'text-left'
                      }`}>
                        {message.user_id !== user?.id && (
                          <div className="text-xs text-gray-500 mb-1">
                            {message.user?.social_name || 'Usuário'}
                          </div>
                        )}
                        
                        <div className={`rounded-lg px-3 py-2 text-sm ${
                          message.user_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}>
                          {message.content}
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      </div>

                      {message.user_id === user?.id && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-blue-600 text-white">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2 relative">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="pr-10"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {showEmojiPicker && (
                <div className="absolute bottom-16 right-4 z-10">
                  <EmojiPicker onEmojiSelect={addEmoji} />
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <div className="w-64 border-l">
              <OnlineUsers onlineUsers={onlineUsers} onlineCount={onlineUsers.length} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
