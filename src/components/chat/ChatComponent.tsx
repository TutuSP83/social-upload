
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Smile, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmojiPicker } from './EmojiPicker';
import { useIsMobile } from '@/hooks/use-mobile';

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

export const ChatComponent = () => {
  const db = supabase as any;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await db
        .from('messages')
        .select('id, content, user_id, created_at')
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // Then get profiles for the unique user_ids
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('id, social_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Combine messages with profiles
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesMap.get(message.user_id) || null
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro ao carregar mensagens",
        description: "Tente recarregar a página",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
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
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-sm">Carregando chat...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto px-2 sm:px-4">
      <Card className="flex-1 flex flex-col h-full max-h-[85vh] sm:max-h-[75vh]">
        <CardHeader className="py-3 sm:py-4 px-3 sm:px-6 flex-shrink-0">
          <CardTitle className="text-lg sm:text-xl text-center">
            Chat Global
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isOwn = message.user_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-start gap-2 sm:gap-3 ${
                        isOwn ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarImage 
                          src={message.profiles?.avatar_url} 
                          alt={message.profiles?.social_name}
                        />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {message.profiles?.social_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            {isOwn ? 'Você' : message.profiles?.social_name || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                        
                        <div
                          className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base break-words ${
                            isOwn
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-muted text-foreground border rounded-bl-sm'
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
          <div className="border-t bg-card p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-end gap-2 sm:gap-3 max-w-full">
              {/* Emoji Button */}
              <div className="relative flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                  title="Adicionar emoji"
                >
                  {showEmojiPicker ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Smile className="h-4 w-4" />
                  )}
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
              <div className="flex-1 min-w-0">
                <Textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[36px] max-h-[120px] resize-none text-sm sm:text-base py-2 sm:py-3"
                  disabled={sending}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0 bg-purple-600 hover:bg-purple-700"
                title="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
