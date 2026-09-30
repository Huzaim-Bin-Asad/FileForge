import "server-only";
import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

/**
 * Server-only transactional email over plain SMTP (Gmail by default — see
 * .env.example). The `server-only` import makes any accidental import from
 * a Client Component a build error, so SMTP credentials can't reach the
 * browser bundle.
 *
 * Vercel-friendly by construction: no pooled or persistent connection. The
 * transporter object is created lazily and reused for as long as the
 * function instance lives (Fluid Compute reuses instances across requests),
 * but each send opens and closes its own short SMTP connection, so nothing
 * is left hanging when the instance is frozen or recycled.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const REQUIRED_VARS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] as const;

type Env = Record<string, string | undefined>;

/**
 * Reads SMTP settings from the environment. Returns null when email isn't
 * configured at all (sends then fall back to a console stub, same as the
 * old no-API-key behavior). Throws when it's only *partly* configured, or
 * a value is malformed — that's a deployment mistake worth surfacing, not
 * silently stubbing. Error messages name variables, never their values.
 */
export function readSmtpConfig(env: Env = process.env): SmtpConfig | null {
  const values = REQUIRED_VARS.map((name) => env[name]?.trim() ?? "");
  const missing = REQUIRED_VARS.filter((_, i) => !values[i]);
  if (missing.length === REQUIRED_VARS.length) return null;
  if (missing.length > 0) {
    throw new Error(`SMTP is partly configured; missing ${missing.join(", ")}.`);
  }
  const [host, user, password] = values;

  const rawPort = env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : 465;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a port number.");
  }

  // Implicit TLS on 465; STARTTLS (secure=false) on 587/25. Defaults to the
  // port's convention when SMTP_SECURE isn't set.
  const rawSecure = env.SMTP_SECURE?.trim().toLowerCase();
  if (rawSecure && rawSecure !== "true" && rawSecure !== "false") {
    throw new Error('SMTP_SECURE must be "true" or "false".');
  }
  const secure = rawSecure ? rawSecure === "true" : port === 465;

  const from = env.EMAIL_FROM?.trim() || `FileForge <${user}>`;

  return { host, port, secure, user, password, from };
}

/** Nodemailer options for one config. Timeouts keep a stuck SMTP server from eating the function's duration. */
export function smtpTransportOptions(config: SmtpConfig) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    // Refuse to fall back to plaintext on the STARTTLS ports.
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

export function buildMailOptions(config: SmtpConfig, message: EmailMessage): SendMailOptions {
  return {
    from: config.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  };
}

let cached: { config: SmtpConfig; transporter: Transporter } | null | undefined;

function getMailer() {
  if (cached === undefined) {
    const config = readSmtpConfig();
    cached = config
      ? { config, transporter: nodemailer.createTransport(smtpTransportOptions(config)) }
      : null;
  }
  return cached;
}

/**
 * Outside production, a failed send is logged as a stub instead of thrown,
 * so auth flows stay testable locally while SMTP isn't set up correctly
 * (e.g. a wrong App Password). Production still throws.
 */
function devFallback(stub: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  console.warn(`[email stub] Send failed, logging instead (dev only). ${stub}`);
  return true;
}

/**
 * Sends one email. Resolves once the SMTP server accepts it; throws a
 * generic Error (never SMTP details) when it can't be sent, so callers keep
 * their existing error responses. Diagnostics go to server logs only —
 * error code/response code/command, never credentials.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const stub = `To ${message.to}: ${message.subject}\n${message.text}`;

  let mailer: ReturnType<typeof getMailer>;
  try {
    mailer = getMailer();
  } catch (e) {
    console.error("Email is misconfigured:", e instanceof Error ? e.message : e);
    if (devFallback(stub)) return;
    throw new Error("Failed to send email.");
  }

  if (!mailer) {
    console.log(`[email stub] ${stub}`);
    return;
  }

  try {
    await mailer.transporter.sendMail(buildMailOptions(mailer.config, message));
  } catch (e) {
    const err = e as { code?: string; responseCode?: number; command?: string };
    console.error("SMTP send failed", {
      code: err.code,
      responseCode: err.responseCode,
      // Verb only (e.g. "AUTH PLAIN") — never any argument that could carry credentials.
      command: err.command?.split(" ").slice(0, 2).join(" "),
      host: mailer.config.host,
      port: mailer.config.port,
    });
    if (devFallback(stub)) return;
    throw new Error("Failed to send email.");
  }
}
