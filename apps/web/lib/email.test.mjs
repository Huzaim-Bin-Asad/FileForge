// Tests for lib/email.ts — no SMTP server or credentials needed. Run with
// `pnpm test` (Node's built-in runner; the react-server condition makes the
// `server-only` import a no-op outside Next).
import { test } from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import { buildMailOptions, readSmtpConfig, sendEmail, smtpTransportOptions } from "./email.ts";

const GMAIL = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "fileforge@example.com",
  SMTP_PASSWORD: "app-password-value",
};

// sendEmail reads the real process.env, so make sure nothing leaks in.
for (const key of [...Object.keys(GMAIL), "EMAIL_FROM"]) delete process.env[key];

test("readSmtpConfig: unconfigured -> null (console stub mode)", () => {
  assert.equal(readSmtpConfig({}), null);
});

test("readSmtpConfig: Gmail settings, EMAIL_FROM defaulting to SMTP_USER", () => {
  assert.deepEqual(readSmtpConfig(GMAIL), {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    user: "fileforge@example.com",
    password: "app-password-value",
    from: "FileForge <fileforge@example.com>",
  });
  assert.equal(
    readSmtpConfig({ ...GMAIL, EMAIL_FROM: "Forge <x@example.com>" }).from,
    "Forge <x@example.com>"
  );
});

test("readSmtpConfig: SMTP_SECURE defaults from the port", () => {
  const rest = { ...GMAIL };
  delete rest.SMTP_SECURE;
  assert.equal(readSmtpConfig({ ...rest, SMTP_PORT: "587" }).secure, false);
  assert.equal(readSmtpConfig({ ...rest, SMTP_PORT: "465" }).secure, true);
});

test("readSmtpConfig: partial or malformed config throws without leaking values", () => {
  assert.throws(
    () => readSmtpConfig({ SMTP_HOST: "smtp.gmail.com", SMTP_PASSWORD: "secret-xyz" }),
    (e) => e.message.includes("SMTP_USER") && !e.message.includes("secret-xyz")
  );
  assert.throws(() => readSmtpConfig({ ...GMAIL, SMTP_PORT: "abc" }), /SMTP_PORT/);
  assert.throws(() => readSmtpConfig({ ...GMAIL, SMTP_SECURE: "yes" }), /SMTP_SECURE/);
});

test("smtpTransportOptions: TLS and timeouts", () => {
  const implicitTls = smtpTransportOptions(readSmtpConfig(GMAIL));
  assert.equal(implicitTls.secure, true);
  assert.equal(implicitTls.requireTLS, false);
  assert.deepEqual(implicitTls.auth, { user: GMAIL.SMTP_USER, pass: GMAIL.SMTP_PASSWORD });
  assert.ok(implicitTls.connectionTimeout > 0 && implicitTls.socketTimeout > 0);

  const startTls = smtpTransportOptions(
    readSmtpConfig({ ...GMAIL, SMTP_PORT: "587", SMTP_SECURE: "false" })
  );
  assert.equal(startTls.requireTLS, true);
});

test("buildMailOptions produces a message nodemailer can compose", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const info = await transport.sendMail(
    buildMailOptions(readSmtpConfig(GMAIL), {
      to: "someone@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    })
  );
  const sent = JSON.parse(info.message);
  assert.equal(sent.from.address, "fileforge@example.com");
  assert.equal(sent.to[0].address, "someone@example.com");
  assert.equal(sent.subject, "Hello");
  assert.equal(sent.text, "Hi");
});

// Order matters below: sendEmail caches its config once read successfully,
// so the misconfigured case (which never caches) must run first.
test("sendEmail: misconfigured in production -> generic error, no secrets", async () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PASSWORD = "secret-xyz";
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(" "));
  try {
    await assert.rejects(
      sendEmail({ to: "a@example.com", subject: "s", html: "h", text: "t" }),
      (e) => e.message === "Failed to send email."
    );
    assert.ok(logged.every((line) => !line.includes("secret-xyz")));
  } finally {
    console.error = originalError;
    process.env.NODE_ENV = prevEnv;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PASSWORD;
  }
});

test("sendEmail: unconfigured -> logs a stub and resolves", async () => {
  const originalLog = console.log;
  const logged = [];
  console.log = (...args) => logged.push(args.join(" "));
  try {
    await sendEmail({ to: "a@example.com", subject: "Code", html: "<p>123</p>", text: "123" });
  } finally {
    console.log = originalLog;
  }
  assert.ok(logged.some((line) => line.includes("[email stub]") && line.includes("a@example.com")));
});
