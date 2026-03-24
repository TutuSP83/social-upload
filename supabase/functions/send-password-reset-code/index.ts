import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: ResetCodeRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate code format
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending password reset code to:", email.substring(0, 3) + "***");

    const { data, error } = await resend.emails.send({
      from: "Cloud Compartilhamento <onboarding@resend.dev>",
      to: [email],
      subject: "Código de Recuperação de Senha",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .code-box { 
                background: #f4f4f4; 
                border: 2px solid #ddd; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                margin: 30px 0;
              }
              .code { 
                font-size: 32px; 
                font-weight: bold; 
                letter-spacing: 8px; 
                color: #2563eb;
                font-family: monospace;
              }
              .warning { color: #666; font-size: 14px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #2563eb;">Recuperação de Senha</h1>
              <p>Você solicitou a recuperação da sua senha.</p>
              <p>Use o código abaixo para continuar:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p class="warning">
                ⚠️ Este código expira em 10 minutos.<br>
                Se você não solicitou esta recuperação, ignore este e-mail.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      throw error;
    }

    console.log("E-mail enviado com sucesso:", data);

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
