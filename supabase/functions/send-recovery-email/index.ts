import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecoveryEmailData {
  email: string;
  token: string;
  tokenHash: string;
  redirectTo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, tokenHash, redirectTo }: RecoveryEmailData = await req.json();

    // Construir URL de recuperação
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const recoveryUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=recovery&redirect_to=${redirectTo}`;

    const emailResponse = await resend.emails.send({
      from: "FILE ROCKET <onboarding@resend.dev>",
      to: [email],
      subject: "Alteração de Senha - FILE ROCKET",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alteração de Senha</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🚀 FILE ROCKET</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Alteração de Senha</h2>
                      <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                        Olá!
                      </p>
                      <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                        Recebemos uma solicitação para <strong>alterar a senha</strong> da sua conta FILE ROCKET.
                      </p>
                      <p style="color: #4b5563; margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
                        Clique no botão abaixo para criar sua nova senha:
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${recoveryUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
                              Alterar Minha Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      <p style="color: #9333ea; margin: 8px 0 0 0; font-size: 12px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                        ${recoveryUrl}
                      </p>
                      
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                      
                      <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⚠️ Importante:</strong> Este link expira em 1 hora por questões de segurança.
                      </p>
                      <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou esta alteração, pode ignorar este email com segurança. Sua senha atual permanecerá inalterada.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} FILE ROCKET. Todos os direitos reservados.
                      </p>
                      <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 11px;">
                        Este é um email automático. Por favor, não responda.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Recovery email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending recovery email:", error);
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
