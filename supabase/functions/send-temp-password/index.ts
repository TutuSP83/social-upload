
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResetPasswordRequest {
  email: string;
}

// Função para gerar senha aleatória
function generateRandomPassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Iniciando função send-temp-password');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    const { email }: ResetPasswordRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Gerar nova senha temporária
    const tempPassword = generateRandomPassword(10);

    // Atualizar senha do usuário usando o Admin API do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    // Buscar usuário pelo email
    const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    });

    if (!getUserResponse.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    const users = await getUserResponse.json();
    const user = users.users?.find((u: any) => u.email === email.toLowerCase());

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Atualizar senha do usuário
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        password: tempPassword
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      console.error('Erro ao atualizar senha:', errorData);
      throw new Error('Erro ao atualizar senha do usuário');
    }

    console.log('Enviando email para:', email);
    
    // Enviar email com a nova senha
    const emailResponse = await resend.emails.send({
      from: "Sistema <noreply@resend.dev>",
      to: [email],
      subject: "Sua nova senha temporária",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Senha Temporária</h2>
          <p>Olá!</p>
          <p>Você solicitou uma nova senha para sua conta. Sua senha temporária é:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong style="font-size: 18px; color: #2563eb;">${tempPassword}</strong>
          </div>
          <p><strong style="color: #dc2626;">Importante:</strong></p>
          <ul>
            <li>Esta é uma senha temporária gerada automaticamente</li>
            <li>Recomendamos que você altere esta senha após fazer login</li>
            <li>Você pode alterar sua senha no seu perfil de usuário</li>
          </ul>
          <p>Se você não solicitou esta alteração, entre em contato conosco imediatamente.</p>
          <p>Atenciosamente,<br>Equipe do Sistema</p>
        </div>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    if (emailResponse.error) {
      console.error("Erro do Resend:", emailResponse.error);
      throw new Error(`Erro ao enviar email: ${emailResponse.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        message: "Nova senha temporária enviada para seu email",
        success: true 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erro na função send-temp-password:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro interno do servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
