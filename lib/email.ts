import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? "noreply@milestone.app";

export async function sendInviteEmail(to: string, tempPassword: string, workspaceName: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM(),
      to,
      subject: `You've been invited to ${workspaceName} on Milestone`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#07111F;margin-bottom:8px">You're invited to ${workspaceName}</h2>
          <p style="color:#555;margin-bottom:24px">An admin has added you to the <strong>${workspaceName}</strong> workspace on Milestone.</p>
          <p style="color:#555;margin-bottom:4px"><strong>Email:</strong> ${to}</p>
          <p style="color:#555;margin-bottom:24px"><strong>Temporary password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${tempPassword}</code></p>
          <a href="${process.env.NEXTAUTH_URL ?? ""}/login" style="display:inline-block;background:#1769FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Sign in to Milestone</a>
          <p style="color:#999;font-size:12px;margin-top:24px">Change your password after signing in.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendInviteEmail failed", err);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM(),
      to,
      subject: "Reset your Milestone password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#07111F;margin-bottom:8px">Reset your password</h2>
          <p style="color:#555;margin-bottom:24px">Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1769FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
          <p style="color:#999;font-size:12px;margin-top:24px">If you didn't request this, ignore this email — your password won't change.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendPasswordResetEmail failed", err);
  }
}
