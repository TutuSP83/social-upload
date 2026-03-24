import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "super-secret-jwt-token-with-at-least-32-characters-long";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Confirmation email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received payload:", payload);
    console.log("Headers:", headers);

    const wh = new Webhook(hookSecret);
    
    let data;
    try {
      data = wh.verify(payload, headers) as {
        user: {
          email: string;
          id: string;
        };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };
    } catch (error) {
      console.error("Webhook verification failed:", error);
      // Se a verificação falhar, tenta parsear diretamente (para desenvolvimento)
      try {
        data = JSON.parse(payload);
      } catch (parseError) {
        console.error("Failed to parse payload:", parseError);
        return new Response("Invalid payload", { status: 400 });
      }
    }

    const { user, email_data } = data;
    const { token_hash, redirect_to, email_action_type } = email_data;

    console.log("Processing email for:", user.email, "Action:", email_action_type);

    // URL de confirmação
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Enviar email de confirmação
    const emailResponse = await resend.emails.send({
      from: "Sistema <onboarding@resend.dev>",
      to: [user.email],
      subject: "Confirme seu email - Sistema",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Bem-vindo!</h1>
            <p style="color: #666; font-size: 16px;">Confirme seu email para ativar sua conta</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; margin-bottom: 20px;">Olá!</p>
            <p style="color: #333; margin-bottom: 20px;">
              Obrigado por se cadastrar! Para completar seu registro e ativar sua conta, 
              clique no botão abaixo para confirmar seu endereço de email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background-color: #7c3aed; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; 
                        display: inline-block;">
                Confirmar Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="color: #7c3aed; font-size: 14px; word-break: break-all;">
              ${confirmationUrl}
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 14px; text-align: center;">
              Se você não se cadastrou, pode ignorar este email com segurança.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Email de confirmação enviado com sucesso",
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
    console.error("Erro na função send-confirmation-email:", error);
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