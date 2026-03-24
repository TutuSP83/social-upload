
import { motion } from 'framer-motion';
import { DashboardStats } from './DashboardStats';
import { StorageStats } from './StorageStats';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { usePresenceManager } from '@/hooks/usePresenceManager';
import { useUserRole } from '@/hooks/useUserRole';
import { Activity, FileText, MessageCircle, TrendingUp, Users, Shield, Bell } from 'lucide-react';

export const ImprovedDashboard = () => {
  const { profile } = useProfile();
  const { stats, loading: statsLoading } = useUserStats();
  const { isOnline } = usePresenceManager();
  const { isAdmin } = useUserRole();

  return (
    <div className="space-y-6">
      {/* Header com busca e notificações */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Activity className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {profile?.social_name || 'Usuário'}! 👋
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Bem-vindo ao seu dashboard
              <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </p>
          </div>
          {isAdmin && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <NotificationCenter />
        </div>
      </motion.div>

      {/* Estatísticas principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.total_files || 0}
            </div>
            <p className="text-sm text-gray-600">Total de arquivos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_messages || 0}
            </div>
            <p className="text-sm text-gray-600">Mensagens enviadas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Feedbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.total_feedbacks || 0}
            </div>
            <p className="text-sm text-gray-600">Feedbacks enviados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-orange-600" />
              Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.last_activity ? 'Ativo' : 'Inativo'}
            </div>
            <p className="text-sm text-gray-600">Status atual</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Estatísticas de armazenamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StorageStats />
      </motion.div>

      {/* Estatísticas detalhadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {statsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-foreground">Carregando estatísticas...</span>
          </div>
        ) : (
          <DashboardStats />
        )}
      </motion.div>

      {/* Novidades */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Novidades da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-foreground">Dashboard com estatísticas de armazenamento detalhadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-foreground">Chat reformulado com melhor performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-foreground">Sistema de feedback completamente renovado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-foreground">Interface mobile otimizada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
