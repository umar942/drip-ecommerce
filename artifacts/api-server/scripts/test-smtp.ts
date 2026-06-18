import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
config({ path: path.join(root, ".env") });

const to = process.argv[2] ?? "muneebkhan4045@gmail.com";

async function main() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (!user || !pass) {
    console.error("Missing SMTP_USER or SMTP_PASS in .env");
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });

  console.log("Verifying SMTP as", user);
  await transport.verify();
  console.log("SMTP OK — sending test to", to);

  const info = await transport.sendMail({
    from: `DRIP <${user}>`,
    to,
    subject: "DRIP — SMTP test",
    text: "If you see this, SMTP is working.",
    html: "<p>If you see this, <b>SMTP is working</b>.</p>",
  });

  console.log("Sent:", info.messageId);
  console.log("Response:", info.response);
}

main().catch((err) => {
  console.error("SMTP FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
