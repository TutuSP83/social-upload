
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { EnhancedHeader } from '@/components/layout/EnhancedHeader';
import { FileManager } from '@/components/files/FileManager';
import { NewChatComponent } from '@/components/chat/NewChatComponent';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { ImprovedDashboard } from '@/components/dashboard/ImprovedDashboard';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { NewFeedbackButton } from '@/components/feedback/NewFeedbackButton';
import { SQLEditor } from '@/components/sql/SQLEditor';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';

export const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState([{ id: null, name: 'Início' }]);
  const { profile, loading } = useProfile();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  // Sincronizar com URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    
    // Manter outros parâmetros como folderId se existirem
    setSearchParams(newSearchParams);
  };

  const handleNavigateToFolder = (folderId: string | null, isSpecial?: boolean, specialType?: 'received' | 'sent') => {
    setCurrentFolderId(folderId);
    
    if (isSpecial && specialType) {
      // Para pastas especiais, definir o caminho apropriado
      if (specialType === 'received') {
        setFolderPath([
          { id: null, name: 'Início' },
          { id: 'special-received', name: 'Recebidos' }
        ]);
      } else if (specialType === 'sent') {
        setFolderPath([
          { id: null, name: 'Início' },
          { id: 'special-sent', name: 'Enviados' }
        ]);
      }
    } else if (folderId === null) {
      // Voltar para o início
      setFolderPath([{ id: null, name: 'Início' }]);
    }
    // Para pastas regulares, o caminho seria atualizado pela lógica específica da pasta
  };

  // console.log('Dashboard render:', { profile: !!profile, loading, activeTab });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ImprovedDashboard />;
      case 'files':
        return (
          <FileManager 
            currentFolderId={currentFolderId}
            onNavigateToFolder={handleNavigateToFolder}
            folderPath={folderPath}
          />
        );
      case 'chat':
        return <NewChatComponent />;
      case 'feedback':
        return <FeedbackList />;
      case 'profile':
        return <ProfileForm />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <div className="text-center p-8">Acesso negado</div>;
      case 'sql-editor':
        return isAdmin ? <SQLEditor /> : <div className="text-center p-8">Acesso negado</div>;
      default:
        return <ImprovedDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <EnhancedHeader activeTab={activeTab} onTabChange={handleTabChange} />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${
          isMobile 
            ? 'pt-2 pb-4 px-2' 
            : 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-foreground">Carregando perfil...</span>
          </div>
        ) : (
          renderContent()
        )}
      </motion.main>
      
      {activeTab !== 'feedback' && <NewFeedbackButton />}
    </div>
  );
};
