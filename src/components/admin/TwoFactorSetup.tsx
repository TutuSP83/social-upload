import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

export const TwoFactorSetup = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Proteja sua conta de administrador com segurança adicional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recomendação de Segurança</AlertTitle>
          <AlertDescription>
            Para contas de administrador, é fortemente recomendado ativar a autenticação de dois fatores (2FA).
            Isso adiciona uma camada extra de segurança, protegendo contra acessos não autorizados mesmo se sua senha for comprometida.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Como ativar o 2FA:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Acesse o painel de configurações do Supabase</li>
              <li>Vá para Authentication → Providers</li>
              <li>Ative o provedor "Phone" ou use um aplicativo autenticador</li>
              <li>Configure o 2FA na sua conta de usuário</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> O 2FA precisa ser configurado no nível do Supabase Authentication. 
              Certifique-se de que todos os administradores ativem esta funcionalidade em suas contas.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
