
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { EnhancedAuthForm } from "@/components/auth/EnhancedAuthForm";
import { WelcomeScreen } from "@/components/auth/WelcomeScreen";
import { Dashboard } from "@/pages/Dashboard";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { ResetPassword } from "@/pages/ResetPassword";
import { PasswordResetByCode } from "@/components/auth/PasswordResetByCode";
import { motion } from "framer-motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
      />
      <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
    </motion.div>
  </div>
);

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // console.log('AppContent render:', { user: !!user, loading });

  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated, checking welcome screen');
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        console.log('Showing welcome screen');
        setShowWelcome(true);
        localStorage.setItem('hasSeenWelcome', 'true');
        
        const timer = setTimeout(() => {
          console.log('Hiding welcome screen');
          setShowWelcome(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading]);

  // Verificar se está em processo de reset de senha
  const isResettingPassword = typeof window !== 'undefined' && 
    (sessionStorage.getItem('password_reset_in_progress') === 'true' ||
     window.location.pathname === '/reset-password-code');

  // Rotas sempre disponíveis para recuperação, garantindo abertura instantânea
  if (loading) {
    return (
      <Routes>
        <Route path="/reset-password-code" element={<PasswordResetByCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="*" element={<LoadingScreen />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password-code" element={<PasswordResetByCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="*" element={<EnhancedAuthForm />} />
      </Routes>
    );
  }

  // Se está resetando senha, mostrar o componente mesmo com usuário logado
  if (isResettingPassword) {
    return <PasswordResetByCode />;
  }

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password-code" element={<PasswordResetByCode />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

function App() {
  // console.log('App render');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="upload-do-tutu-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
