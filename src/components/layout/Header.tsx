
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Upload, MessageCircle, Settings, Users } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useUserRole();

  const tabs = [
    { id: 'files', label: 'Arquivos', icon: Upload },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'profile', label: 'Perfil', icon: Settings },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Users }] : [])
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-purple-600">FILE ROCKET</h1>
              <span className="text-xs text-gray-400 opacity-60">by TUTU</span>
            </div>
            <nav className="flex space-x-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => onTabChange(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>
                {profile?.social_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">{profile?.social_name ?? ''}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
