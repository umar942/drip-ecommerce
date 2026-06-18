import nodemailer from "nodemailer";
import type { OtpPurpose } from "@workspace/db";

const RED = "#ff0000";
const BLACK = "#0a0a0a";
const GRAY = "#666666";
const LIGHT = "#f5f5f5";
const WHITE = "#ffffff";
const BORDER = "#dddddd";

function getSmtpConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in .env (use a Gmail App Password)");
  }
  return {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  };
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (from?.includes("<")) return from;
  if (from?.includes("@")) return `DRIP <${from}>`;
  return `DRIP <${process.env.SMTP_USER}>`;
}

/** 6 separate digit boxes — works in Gmail, Outlook, Apple Mail */
function otpRow(code: string): string {
  return code
    .padEnd(6, "0")
    .slice(0, 6)
    .split("")
    .map(
      (d) => `
      <td align="center" valign="middle" width="46" height="54"
        style="width:46px;height:54px;border:2px solid ${BLACK};border-bottom:3px solid ${RED};background-color:${WHITE};font-family:Courier,monospace;font-size:26px;font-weight:bold;color:${BLACK};">
        ${d}
      </td>
      <td width="8" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>`,
    )
    .join("");
}

function wrapLayout(opts: {
  preheader: string;
  subtitle: string;
  title: string;
  message: string;
  code: string;
  footerNote: string;
}): string {
  const { preheader, subtitle, title, message, code, footerNote } = opts;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>DRIP</title>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT};">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;color:${LIGHT};">${preheader}</span>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${LIGHT};">
<tr><td align="center" style="padding:32px 12px;">
<table border="0" cellpadding="0" cellspacing="0" width="480" style="max-width:480px;width:100%;background-color:${WHITE};border:1px solid ${BORDER};">

  <!-- Red accent strip -->
  <tr><td height="4" style="background-color:${RED};font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- Logo block -->
  <tr>
    <td align="center" style="padding:36px 32px 20px;background-color:${WHITE};">
      <p style="margin:0;font-family:Arial Black,Arial,sans-serif;font-size:44px;font-weight:900;color:${RED};letter-spacing:-1px;line-height:1;">DRIP</p>
      <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:${BLACK};letter-spacing:3px;text-transform:uppercase;">${subtitle}</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 32px;"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${BORDER};font-size:0;">&nbsp;</td></tr></table></td></tr>

  <!-- Content -->
  <tr>
    <td style="padding:28px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:${RED};letter-spacing:2px;text-transform:uppercase;">${title}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:${GRAY};">${message}</p>

      <p style="margin:0 0 12px;font-size:11px;font-weight:bold;color:${GRAY};letter-spacing:2px;text-transform:uppercase;text-align:center;">Verification Code</p>

      <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 24px;">
        <tr>${otpRow(code)}</tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 20px;">
        <tr>
          <td align="center" style="background-color:${LIGHT};border:1px solid ${BORDER};padding:10px 20px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;color:${GRAY};letter-spacing:1px;text-transform:uppercase;">
            Expires in <span style="color:${RED};">10 minutes</span>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:12px;line-height:20px;color:${GRAY};text-align:center;">${footerNote}</p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td align="center" style="padding:20px 32px 28px;background-color:${LIGHT};border-top:1px solid ${BORDER};">
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;color:${BLACK};letter-spacing:2px;text-transform:uppercase;">Define Your Identity</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:${GRAY};">Premium Streetwear &bull; &copy; ${new Date().getFullYear()} DRIP</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildEmailContent(purpose: OtpPurpose, code: string) {
  if (purpose === "signup") {
    const html = wrapLayout({
      preheader: `Your DRIP code: ${code}`,
      subtitle: "Create Identity",
      title: "Verify Your Email",
      message: "Enter this code on the registration page to complete your account. One step away from premium streetwear.",
      code,
      footerNote: "Didn't sign up? Ignore this email.",
    });
    return { subject: "DRIP — Your verification code", html };
  }

  const html = wrapLayout({
    preheader: `Your DRIP reset code: ${code}`,
    subtitle: "Account Access",
    title: "Reset Password",
    message: "Enter this code on the reset password page to choose a new password.",
    code,
    footerNote: "Didn't request this? Your password won't change.",
  });
  return { subject: "DRIP — Password reset code", html };
}

export async function sendOtpEmail(to: string, purpose: OtpPurpose, code: string): Promise<void> {
  const transporter = nodemailer.createTransport(getSmtpConfig());
  const { subject, html } = buildEmailContent(purpose, code);

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
    // Minimal plain fallback — HTML is primary
    text: `DRIP\n\nYour code: ${code}\n\nExpires in 10 minutes.`,
    alternatives: [
      {
        contentType: "text/html; charset=UTF-8",
        content: html,
      },
    ],
  });
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await nodemailer.createTransport(getSmtpConfig()).verify();
    return true;
  } catch {
    return false;
  }
}
