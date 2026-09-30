import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordSchema,
});

export const setPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
  confirmation: z.string().optional(),
});

export const deactivateAccountSchema = z.object({
  password: z.string().optional(),
  confirmation: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name can't be empty.").max(80, "Name is too long."),
});

const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");

export const twoFactorEnableSchema = z.object({
  code: totpCodeSchema,
});

export const twoFactorDisableSchema = z.object({
  password: z.string().optional(),
  code: z.string().optional(),
});

export const twoFactorLoginVerifySchema = z.object({
  challenge: z.string().min(1, "Missing challenge."),
  // Either a 6-digit TOTP code or an "XXXX-XXXX" backup code — checked
  // against whichever it looks like server-side, so the field stays generic.
  code: z.string().min(1, "Enter a code."),
});

export const requestEmailChangeSchema = z.object({
  newEmail: emailSchema,
  password: z.string().optional(),
});

export const confirmEmailChangeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code we emailed you."),
});

/** All three null clears the override (back to the Light/Dark token default); a hex-format check on any non-null value happens in the route, which also owns the "all three or none" rule. */
export const appearanceSchema = z.object({
  background: z.string().nullable(),
  accent: z.string().nullable(),
  text: z.string().nullable(),
});
