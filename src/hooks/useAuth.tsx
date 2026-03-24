
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const isRedirectUrlError = (message: string | undefined) => {
  if (!message) return false;
  return /redirect|redirect_url|redirect uri|site url|invalid url/i.test(message);
};

const getAppUrl = () => {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  return (envUrl && envUrl.trim()) ? envUrl.trim() : window.location.origin;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Limpar localStorage quando o usuário faz logout
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing localStorage');
          setSession(null);
          setUser(null);
          localStorage.removeItem('hasSeenWelcome');
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          console.log('Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful');
      }
      return { error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('Attempting sign up for:', email);
      const redirectUrl = `${getAppUrl()}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      
      if (error) {
        if (isRedirectUrlError(error.message)) {
          console.warn('Sign up redirect URL error, retrying without emailRedirectTo:', error.message);
          const { error: retryError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData
            }
          });

          if (retryError) {
            console.error('Sign up retry error:', retryError);
            return { error: retryError };
          }

          console.log('Sign up successful (fallback without emailRedirectTo)');
          return { error: null };
        }

        console.error('Sign up error:', error);
        // If user already registered, try to resend confirmation email
        if (error.message?.includes('User already registered')) {
          console.log('User already registered, attempting to resend confirmation email');
          let { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: redirectUrl
            }
          });

          if (resendError && isRedirectUrlError(resendError.message)) {
            console.warn('Resend redirect URL error, retrying without emailRedirectTo:', resendError.message);
            ({ error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
            }));
          }
          if (resendError) {
            console.error('Resend error:', resendError);
            return { error: resendError };
          } else {
            console.log('Confirmation email resent successfully');
            // Return no error so UI shows success message
            return { error: null };
          }
        }
        return { error };
      } else {
        console.log('Sign up successful');
        return { error };
      }
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out');
      
      // Forçar limpeza do estado local primeiro
      setUser(null);
      setSession(null);
      localStorage.removeItem('hasSeenWelcome');
      
      // Depois fazer o signOut no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
      
      // Garantir que o estado seja limpo independentemente do resultado
      setUser(null);
      setSession(null);
      setLoading(false);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Mesmo com erro, limpar o estado local
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  console.log('AuthProvider render:', { user: !!user, loading });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
