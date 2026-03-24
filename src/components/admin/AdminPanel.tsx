
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Files, MessageCircle, Shield, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { TwoFactorSetup } from './TwoFactorSetup';

// NOTE: o arquivo de tipos do backend ainda não descreve estas tabelas em tempo de build.
// Para não quebrar o build, tipamos os registros como `any` aqui (o runtime continua igual).
type Profile = any;
type FileItem = any;
type Message = any;
type Feedback = any;

export const AdminPanel = () => {
  const db = supabase as any;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, filesRes, messagesRes, feedbacksRes] = await Promise.all([
        db.from('profiles').select(`
          *,
          user_roles(role)
        `).order('created_at', { ascending: false }),
        db.from('files').select('*').order('uploaded_at', { ascending: false }),
        db.from('messages').select('*').order('created_at', { ascending: false }),
        db.from('feedback').select('*').order('created_at', { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (filesRes.error) throw filesRes.error;
      if (messagesRes.error) throw messagesRes.error;
      if (feedbacksRes.error) throw feedbacksRes.error;

      setProfiles(profilesRes.data || []);
      setFiles(filesRes.data || []);
      setMessages(messagesRes.data || []);
      setFeedbacks(feedbacksRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados administrativos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      if (currentIsAdmin) {
        const { error } = await db
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await db
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }
      
      fetchData();
      toast({
        title: "Permissões atualizadas",
        description: `Usuário ${!currentIsAdmin ? 'promovido a' : 'removido de'} administrador`
      });
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast({
        title: "Erro ao atualizar permissões",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([filePath]);

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Deletar da tabela
      const { error } = await db
        .from('files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      
      fetchData();
      toast({
        title: "Arquivo deletado",
        description: "O arquivo foi removido com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro ao deletar arquivo",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await db
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      fetchData();
      toast({
        title: "Mensagem deletada",
        description: "A mensagem foi removida com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      toast({
        title: "Erro ao deletar mensagem",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    try {
      const { error } = await db
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
      
      fetchData();
      toast({
        title: "Feedback deletado",
        description: "O feedback foi removido com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar feedback:', error);
      toast({
        title: "Erro ao deletar feedback",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  if (loading || roleLoading) {
    return <div>Carregando dados administrativos...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-500">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Acesso Negado</p>
          <p className="text-sm">Você não tem permissões de administrador.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Painel Administrativo</h2>
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          Admin
        </Badge>
      </div>

      {/* 2FA Setup Info */}
      <TwoFactorSetup />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciar Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.map((profile) => {
              // Mask sensitive data
              const maskEmail = (email: string | null) => {
                if (!email) return 'N/A';
                const [name, domain] = email.split('@');
                if (!name || !domain) return 'N/A';
                return `${name.substring(0, 3)}***@${domain}`;
              };
              
              const maskLocation = (city: string | null, state: string | null, country: string | null) => {
                if (!city || !state) return 'N/A';
                return `${city.substring(0, 3)}***, ${state.substring(0, 2)}***`;
              };

              return (
                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.social_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.social_name}</p>
                      <p className="text-sm text-gray-500">{maskEmail(profile.email)}</p>
                      <p className="text-xs text-gray-400">
                        {maskLocation(profile.city, profile.state, profile.country)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(profile.user_roles as any[])?.some((r) => r.role === 'admin') && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    <Button
                      variant={(profile.user_roles as any[])?.some((r) => r.role === 'admin') ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAdmin(profile.id, (profile.user_roles as any[])?.some((r) => r.role === 'admin') || false)}
                    >
                      {(profile.user_roles as any[])?.some((r) => r.role === 'admin') ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Tamanho: {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Enviado em: {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteFile(file.id, file.path)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{feedback.feedback_type}</p>
                  <p className="text-sm text-gray-600 truncate max-w-md">{feedback.feedback_text}</p>
                  <p className="text-xs text-gray-400">
                    Por: {feedback.user_email || 'Anônimo'} em {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteFeedback(feedback.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Mensagens do Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 truncate max-w-md">{message.content}</p>
                  <p className="text-xs text-gray-400">
                    Em: {message.created_at ? new Date(message.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMessage(message.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
