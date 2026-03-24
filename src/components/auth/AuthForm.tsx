import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    socialName: '',
    fullName: ''
  });
  
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          // Mensagens de erro mais amigáveis
          let errorMessage = error.message;
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
          }
          toast({
            title: "Erro no login",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao UPLOAD DO TUTU"
          });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          social_name: formData.socialName,
          full_name: formData.fullName
        });
        if (error) {
          let errorMessage = error.message;
          if (error.message.includes('User already registered')) {
            errorMessage = 'Este email já está cadastrado. Tente fazer login.';
          }
          toast({
            title: "Erro no cadastro",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Você já pode fazer login."
          });
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-600">
            UPLOAD DO TUTU
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Faça login na sua conta' : 'Crie sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder="Nome social"
                  value={formData.socialName}
                  onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
                  required
                />
              </>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              className="text-sm text-purple-600 hover:underline block w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
            {isLogin && (
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-purple-600 hover:underline"
                onClick={() => navigate('/reset-password')}
              >
                Esqueceu a senha?
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
