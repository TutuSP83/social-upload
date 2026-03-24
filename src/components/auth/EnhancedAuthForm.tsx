
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Calendar, MapPin, Phone } from 'lucide-react';

export const EnhancedAuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    social_name: '',
    birth_date: '',
    country: '',
    state: '',
    city: '',
    phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          let errorMessage = "Erro ao fazer login";
          if (error.message?.includes('Invalid login credentials')) {
            errorMessage = "Email ou senha incorretos";
          } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = "Por favor, confirme seu email antes de fazer login";
          }
          
          toast({
            title: "Erro no login",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo de volta!"
          });
        }
      } else {
        if (!formData.email || !formData.password || !formData.social_name) {
          toast({
            title: "Campos obrigatórios",
            description: "Email, senha e nome social são obrigatórios",
            variant: "destructive"
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.full_name,
          social_name: formData.social_name,
          birth_date: formData.birth_date,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          phone: formData.phone
        });

        if (error) {
          let errorMessage = "Erro ao criar conta";
          if (error.message?.includes('User already registered')) {
            errorMessage = "Este email já está cadastrado";
          } else if (error.message?.includes('Password should be at least')) {
            errorMessage = "A senha deve ter pelo menos 6 caracteres";
          }
          
          toast({
            title: "Erro no cadastro",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta"
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Formulário principal
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {isLogin 
                ? 'Entre com sua conta para continuar' 
                : 'Preencha os dados para criar sua conta'
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    defaultValue={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Campos de cadastro */}
              {!isLogin && (
                <>
                  <Separator />
                  
                  {/* Nome Social */}
                  <div className="space-y-2">
                    <Label htmlFor="social_name">Nome Social *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="social_name"
                        placeholder="Como quer ser chamado?"
                        value={formData.social_name}
                        onChange={(e) => handleInputChange('social_name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="full_name"
                        placeholder="Seu nome completo"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Localização */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-xs">País</Label>
                      <Input
                        id="country"
                        placeholder="Brasil"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-xs">Estado</Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs">Cidade</Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Carregando..." : (isLogin ? "Entrar" : "Criar Conta")}
              </Button>
            </form>

            {isLogin && (
              <div className="text-center">
                <Link
                  to="/reset-password-code"
                  replace
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
            )}

            <Separator />

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
