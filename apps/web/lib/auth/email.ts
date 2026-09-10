import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM ?? "FileForge <onboarding@resend.dev>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends the password-reset email via Resend when RESEND_API_KEY is set.
 * Without it (local dev, or before a sender domain is verified), falls back
 * to logging the link so the flow stays testable without a real provider.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.log(`[email stub] Password reset for ${email}: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: "Reset your FileForge password",
    html: `
      <p>Someone asked to reset the password for this FileForge account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
    text: `Reset your FileForge password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });

  if (error) {
    console.error("Failed to send password reset email", error);
    throw new Error("Failed to send password reset email.");
  }
}
