import nodemailer from "nodemailer";
import type { OtpPurpose } from "@workspace/db";

/** DRIP storefront palette (matches artifacts/shop dark theme) */
const THEME = {
  bg: "#0a0a0a",
  card: "#0f0f0f",
  border: "#2a2a2a",
  primary: "#ff0000",
  text: "#fafafa",
  muted: "#a3a3a3",
  panel: "#141414",
} as const;

function getSmtpConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error(
      "SMTP_USER and SMTP_PASS must be set in .env (use a Gmail App Password)",
    );
  }
  return {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  };
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? `DRIP Store <${process.env.SMTP_USER}>`;
}

function buildDripHtml(options: {
  eyebrow: string;
  headline: string;
  body: string;
  code: string;
  footer: string;
}): string {
  const { eyebrow, headline, body, code, footer } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DRIP</title>
</head>
<body style="margin:0;padding:0;background-color:${THEME.bg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${THEME.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:${THEME.card};border:1px solid ${THEME.border};">
          <!-- Top accent bar -->
          <tr>
            <td style="height:3px;background-color:${THEME.primary};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding:36px 32px 24px;text-align:center;border-bottom:1px solid ${THEME.border};">
              <p style="margin:0 0 8px;font-family:Impact,'Arial Black','Helvetica Neue',Arial,sans-serif;font-size:42px;font-weight:800;letter-spacing:-1px;text-transform:uppercase;color:${THEME.primary};line-height:1;">DRIP</p>
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:${THEME.muted};">Premium Streetwear</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${THEME.primary};">${eyebrow}</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${THEME.text};line-height:1.3;">${headline}</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:${THEME.muted};">${body}</p>
              <!-- OTP box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color:${THEME.panel};border:1px solid ${THEME.border};border-left:3px solid ${THEME.primary};padding:28px 20px;">
                    <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${THEME.muted};">Your verification code</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:0.35em;color:${THEME.text};">${code}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${THEME.muted};">${footer}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${THEME.border};text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${THEME.text};">Define Your Identity</p>
              <p style="margin:0;font-size:12px;color:${THEME.muted};">&copy; ${new Date().getFullYear()} DRIP. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailContent(
  purpose: OtpPurpose,
  code: string,
): { subject: string; text: string; html: string } {
  const expiry = "10 minutes";

  if (purpose === "signup") {
    return {
      subject: "DRIP — Verify your account",
      text: [
        "DRIP — Verify your account",
        "",
        `Your verification code: ${code}`,
        "",
        `This code expires in ${expiry}.`,
        "If you did not create a DRIP account, you can safely ignore this email.",
        "",
        "— DRIP Premium Streetwear",
      ].join("\n"),
      html: buildDripHtml({
        eyebrow: "Account Access",
        headline: "Verify Your Email",
        body: "You're one step away from joining DRIP. Enter the code below to complete your registration and start shopping premium streetwear.",
        code,
        footer: `Code expires in <strong style="color:${THEME.text};">${expiry}</strong>. Didn't sign up? Ignore this email — your inbox stays secure.`,
      }),
    };
  }

  return {
    subject: "DRIP — Reset your password",
    text: [
      "DRIP — Reset your password",
      "",
      `Your reset code: ${code}`,
      "",
      `This code expires in ${expiry}.`,
      "If you did not request a password reset, ignore this email.",
      "",
      "— DRIP Premium Streetwear",
    ].join("\n"),
    html: buildDripHtml({
      eyebrow: "Security",
      headline: "Reset Password",
      body: "We received a request to reset your DRIP account password. Use the code below to choose a new password.",
      code,
      footer: `Code expires in <strong style="color:${THEME.text};">${expiry}</strong>. Didn't request a reset? Ignore this email — your password won't change.`,
    }),
  };
}

export async function sendOtpEmail(to: string, purpose: OtpPurpose, code: string): Promise<void> {
  const transporter = nodemailer.createTransport(getSmtpConfig());
  const content = buildEmailContent(purpose, code);

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport(getSmtpConfig());
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
