import { Resend } from "resend";

interface SendSuperAdminInvitationEmailProps {
  to: string;
  inviteLink: string;
  invitedByName: string | null;
  invitedByEmail: string;
}

export async function sendSuperAdminInvitationEmail({
  to,
  inviteLink,
  invitedByName,
  invitedByEmail,
}: SendSuperAdminInvitationEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const resendInstance = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = process.env.FROM_EMAIL || "invites@projet360.ca";
  const inviterName = invitedByName || invitedByEmail;

  try {
    const { data, error } = await resendInstance.emails.send({
      from: `Projet 360 <${FROM_EMAIL}>`,
      to: [to],
      subject: `${inviterName} vous invite à rejoindre l'équipe Projet 360 en tant que super admin`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
    .badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin: 8px 0; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Projet 360</div>
    </div>
    <div class="content">
      <h2>Invitation Super Admin</h2>
      <p><strong>${inviterName}</strong> vous invite à rejoindre l'équipe de gestion de la plateforme Projet 360.</p>
      <div><span class="badge">Super Admin</span></div>
      <p>En tant que super admin, vous aurez accès à tous les projets de la plateforme.</p>
      <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
      <a href="${inviteLink}" class="button">Accepter l'invitation</a>
      <p style="font-size: 12px; color: #6b7280;">
        Ou copiez ce lien :<br>${inviteLink}
      </p>
    </div>
    <div class="footer">
      Si vous n'attendiez pas cette invitation, ignorez cet email.
    </div>
  </div>
</body>
</html>`,
      text: `${inviterName} vous invite à rejoindre l'équipe de gestion de Projet 360 en tant que Super Admin.\n\nAcceptez l'invitation ici :\n${inviteLink}\n\nL'équipe Projet 360`,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (error: unknown) {
    console.error("Error sending super admin invitation email:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "invites@projet360.ca";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendInvitationEmailProps {
  to: string;
  inviteLink: string;
  invitedByName: string | null;
  invitedByEmail: string;
  projects: Array<{ name: string; color?: string | null }>;
}

export async function sendInvitationEmail({
  to,
  inviteLink,
  invitedByName,
  invitedByEmail,
  projects,
}: SendInvitationEmailProps) {
  console.log("sendInvitationEmail called with:", { to, from: FROM_EMAIL, hasApiKey: !!process.env.RESEND_API_KEY });
  
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const projectsList = projects
    .map((p) => `  • ${p.name}`)
    .join("\n");

  const inviterName = invitedByName || invitedByEmail;

  try {
    const { data, error } = await resend.emails.send({
      from: `Projet 360 <${FROM_EMAIL}>`,
      to: [to],
      subject: `${inviterName} vous invite à rejoindre Projet 360`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .projects { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Projet 360</div>
    </div>
    
    <div class="content">
      <h2>Vous avez été invité !</h2>
      
      <p><strong>${inviterName}</strong> vous invite à rejoindre des projets sur Projet 360.</p>
      
      <div class="projects">
        <strong>Projets :</strong><br>
        ${projectsList.replace(/\n/g, "<br>")}
      </div>
      
      <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
      
      <a href="${inviteLink}" class="button">Rejoindre les projets</a>
      
      <p style="font-size: 12px; color: #6b7280;">
        Ou copiez ce lien :<br>
        ${inviteLink}
      </p>
    </div>
    
    <div class="footer">
      Si vous n'attendiez pas cette invitation, ignorez cet email.
    </div>
  </div>
</body>
</html>
      `,
      text: `
Bonjour,

${inviterName} vous invite à rejoindre des projets sur Projet 360.

Projets :
${projectsList}

Pour accepter l'invitation, cliquez sur ce lien :
${inviteLink}

À bientôt,
L'équipe Projet 360
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error?.message };
  }
}
