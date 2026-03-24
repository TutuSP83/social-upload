import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

type Step = 'email' | 'sent';

// Validation schemas
const emailSchema = z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo");

export function PasswordResetByCode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Persistir step no sessionStorage para não perder ao re-renderizar
  const [step, setStep] = useState<Step>(() => {
    const savedStep = sessionStorage.getItem('reset_password_step');
    return savedStep === 'sent' ? 'sent' : 'email';
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastOtpRequestTime, setLastOtpRequestTime] = useState<number | null>(null);

  // Rate limiting check for OTP requests
  const canRequestOtp = () => {
    if (!lastOtpRequestTime) return true;
    
    const hourInMs = 60 * 60 * 1000;
    const timeSinceLastRequest = Date.now() - lastOtpRequestTime;
    
    if (timeSinceLastRequest < hourInMs) {
      const requestsInLastHour = parseInt(localStorage.getItem(`otp_requests_${email}`) || "0");
      return requestsInLastHour < 3;
    }
    
    // Reset counter if more than 1 hour has passed
    localStorage.setItem(`otp_requests_${email}`, "0");
    return true;
  };

  const incrementOtpRequests = () => {
    const currentCount = parseInt(localStorage.getItem(`otp_requests_${email}`) || "0");
    localStorage.setItem(`otp_requests_${email}`, String(currentCount + 1));
    setLastOtpRequestTime(Date.now());
    
    // Schedule cleanup after 1 hour
    setTimeout(() => {
      localStorage.removeItem(`otp_requests_${email}`);
    }, 60 * 60 * 1000);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "E-mail inválido",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Check rate limiting
    if (!canRequestOtp()) {
      toast({
        title: "Limite de solicitações atingido",
        description: "Aguarde 1 hora para tentar novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const appUrl = (import.meta.env.VITE_APP_URL?.trim() || window.location.origin);
      const redirectTo = `${appUrl}/reset-password`;
      let { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (error && /redirect|site url|invalid url/i.test(error.message || '')) {
        ({ error } = await supabase.auth.resetPasswordForEmail(email.trim()));
      }

      if (error) throw error;

      incrementOtpRequests();
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada e spam e abra o link para redefinir a senha.",
      });

      sessionStorage.setItem('reset_password_step', 'sent');
      setStep('sent');
    } catch (error: any) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      toast({
        title: "Erro",
        description: error?.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'email') {
                    sessionStorage.removeItem('reset_password_step');
                    navigate('/', { replace: true });
                  } else {
                    sessionStorage.setItem('reset_password_step', 'email');
                    setStep('email');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Recuperar Senha</CardTitle>
            </div>
            <CardDescription>
              {step === 'email' && 'Informe seu e-mail para receber o link de redefinição'}
              {step === 'sent' && 'Abra o link recebido por e-mail para escolher uma nova senha'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      className="pl-10"
                      disabled={loading}
                      autoFocus
                      maxLength={255}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    sessionStorage.removeItem('reset_password_step');
                    navigate('/', { replace: true });
                  }}
                >
                  Fazer login
                </Button>
              </form>
            )}

            {step === 'sent' && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Se o e-mail existir, você vai receber um link para redefinir a senha.
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    sessionStorage.setItem('reset_password_step', 'email');
                    setStep('email');
                  }}
                  disabled={loading}
                >
                  Enviar novamente
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    sessionStorage.removeItem('reset_password_step');
                    navigate('/', { replace: true });
                  }}
                >
                  Voltar para login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
