
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ResetPasswordSetup = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Configuração da Funcionalidade "Esqueci Senha"
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Siga os passos abaixo para configurar o envio de emails de recuperação de senha
        </p>
      </div>

      {/* Passo 1: Resend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <Mail className="h-5 w-5" />
            Configurar Resend.com
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            O Resend é o serviço que utilizamos para enviar emails. É necessário criar uma conta e configurar uma API key.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">1.1. Criar conta no Resend</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://resend.com', '_blank')}
              >
                Abrir Resend
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">1.2. Criar API Key</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://resend.com/api-keys', '_blank')}
              >
                Criar API Key
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">1.3. Validar domínio</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://resend.com/domains', '_blank')}
              >
                Validar Domínio
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> É obrigatório validar seu domínio no Resend para que os emails sejam enviados com sucesso.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 2: Supabase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <Key className="h-5 w-5" />
            Configurar Secrets no Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Após obter a API key do Resend, você precisa configurá-la como um secret no Supabase.
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Secret necessário:
              </h4>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border">
                <code className="text-sm font-mono">RESEND_API_KEY</code>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard('RESEND_API_KEY')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">Acessar Edge Functions Secrets</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rqvzvcujofvfvmnqdtaz/settings/functions', '_blank')}
              >
                Configurar Secrets
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cole a API key do Resend no campo <code>RESEND_API_KEY</code> nas configurações de secrets do Supabase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 3: Testar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <Eye className="h-5 w-5" />
            Testar Funcionalidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Após configurar tudo, teste a funcionalidade de recuperação de senha.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">Como testar:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-6">
                <li>Vá para a tela de login</li>
                <li>Clique em "Esqueci minha senha"</li>
                <li>Digite um email válido</li>
                <li>Verifique se o email foi recebido</li>
                <li>Use a senha temporária para fazer login</li>
              </ol>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium">Ver logs da função</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/rqvzvcujofvfvmnqdtaz/functions/send-temp-password/logs', '_blank')}
              >
                Ver Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Status da Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Edge Function criada</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Concluído
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Resend API Key</span>
              <Badge variant="outline">
                Aguardando configuração
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Domínio validado</span>
              <Badge variant="outline">
                Aguardando validação
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
