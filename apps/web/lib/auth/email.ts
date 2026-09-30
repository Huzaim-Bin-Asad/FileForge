import { sendEmail } from "@/lib/email";

/**
 * Sends the password-reset email over SMTP (see lib/email.ts). Without SMTP
 * configured (local dev), the email is logged instead so the flow stays
 * testable without a real mailbox.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Reset your FileForge password",
    html: `
      <p>Someone asked to reset the password for this FileForge account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
    text: `Reset your FileForge password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });
}

/**
 * Sends the email-change verification code to the *new* address — proving
 * it's reachable is the whole point, so this never goes to the old one.
 * Same log-instead fallback as the password reset email above.
 */
export async function sendEmailChangeCode(newEmail: string, code: string): Promise<void> {
  await sendEmail({
    to: newEmail,
    subject: `${code} is your FileForge verification code`,
    html: `
      <p>Use this code to confirm this as your new FileForge sign-in email:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
    `,
    text: `Your FileForge verification code: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, you can ignore this email.`,
  });
}
