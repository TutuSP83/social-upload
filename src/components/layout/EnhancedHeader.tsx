
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AnimatedLogo } from './AnimatedLogo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Home,
  FileText,
  MessageSquare,
  MessageSquareHeart,
  User,
  Settings,
  LogOut,
  Menu,
  Database // Adicionado ícone para SQL Editor
} from 'lucide-react';

interface EnhancedHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const EnhancedHeader = ({ activeTab, onTabChange }: EnhancedHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'files', label: 'Arquivos', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
    { id: 'profile', label: 'Perfil', icon: User },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    ...(isAdmin ? [{ id: 'sql-editor', label: 'SQL Editor', icon: Database }] : []),
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-purple-600">FILE ROCKET</h1>
            <span className="text-xs text-gray-400 opacity-60">by TUTU</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={activeTab === item.id ? "bg-accent" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-2">
          {!isMobile && activeTab !== 'chat' && <GlobalSearch />}
          <NotificationCenter />
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.social_name ?? 'Avatar'} />
                  <AvatarFallback>
                    {profile?.social_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {profile?.social_name && (
                    <p className="font-medium">{profile?.social_name}</p>
                  )}
                  {profile?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {profile?.email}
                    </p>
                  )}
                  {isAdmin && (
                    <Badge variant="secondary" className="w-fit">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTabChange('profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => onTabChange('admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTabChange('sql-editor')}>
                    <Database className="mr-2 h-4 w-4" />
                    <span>SQL Editor</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
