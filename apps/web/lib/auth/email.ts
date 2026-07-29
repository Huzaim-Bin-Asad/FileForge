/**
 * No email provider is wired up yet. This stub just logs the reset link so the
 * forgot-password flow is testable in dev. Swap this out for a real provider
 * (Resend, Postmark, etc.) before shipping password reset to real users.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  console.log(`[email stub] Password reset for ${email}: ${resetUrl}`);
}
