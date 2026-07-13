import { Resend } from 'resend';
import { EMAIL_FROM, getSiteUrl } from '@/lib/site';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build');

const FROM_ADDRESS = EMAIL_FROM;

/** Whether outbound email can actually be delivered. Send functions no-op
 * (and return false) when unconfigured so callers can offer a manual fallback
 * instead of implying an email went out. */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ---------- Invite email ----------

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteUrl: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  companyName,
  role,
  inviteUrl,
}: SendInviteEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const roleLabel = role === 'admin' ? 'an admin' : 'a sales rep';

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${inviterName} invited you to join ${companyName} on RoofViz`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color:#3b2314;padding:32px 40px;text-align:center;">
            <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Roof<span style="color:#e8632b;">Viz</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#3b2314;">You've been invited!</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c4033;">
              <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as ${roleLabel} on RoofViz &mdash; the roof visualization platform that helps roofing companies close more deals.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td style="background-color:#e8632b;border-radius:8px;padding:14px 32px;text-align:center;">
                <a href="${inviteUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Accept Invite</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9c8578;line-height:1.5;">
              Or copy this link into your browser:<br />
              <a href="${inviteUrl}" style="color:#e8632b;word-break:break-all;">${inviteUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f0e6de;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9c8578;">
              This invite was sent by ${companyName} via RoofViz. If you weren't expecting this, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error('Failed to send invite email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return false;
  }
}

// ---------- Welcome email ----------

interface SendWelcomeEmailParams {
  to: string;
  fullName: string;
  companyName: string;
}

export async function sendWelcomeEmail({
  to,
  fullName,
  companyName,
}: SendWelcomeEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const firstName = fullName.split(' ')[0] || fullName;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Welcome to RoofViz, ${firstName}!`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#fdf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf8f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color:#3b2314;padding:32px 40px;text-align:center;">
            <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Roof<span style="color:#e8632b;">Viz</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#3b2314;">Welcome aboard, ${firstName}!</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c4033;">
              Your account for <strong>${companyName}</strong> is all set. You can now start creating roof visualizations that help homeowners see exactly what their new roof will look like.
            </p>
            <h2 style="margin:0 0 12px;font-size:16px;color:#3b2314;">Get started in 3 steps:</h2>
            <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.8;color:#5c4033;">
              <li>Upload a photo of a home</li>
              <li>Pick a shingle style and color</li>
              <li>Share the visualization with your customer</li>
            </ol>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td style="background-color:#e8632b;border-radius:8px;padding:14px 32px;text-align:center;">
                <a href="${getSiteUrl()}/visualize" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">Create Your First Visualization</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9c8578;">
              Questions? Just reply to this email &mdash; we're here to help.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f0e6de;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9c8578;">
              You're receiving this because you signed up for RoofViz. &copy; ${new Date().getFullYear()} RoofViz
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    if (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return false;
  }
}
