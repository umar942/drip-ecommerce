import "@workspace/db/load-env";
import app from "./app";
import { connectDb } from "@workspace/db";
import { logger } from "./lib/logger";
import { verifySmtpConnection } from "./lib/email";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await connectDb();

const smtpOk = await verifySmtpConnection();
if (smtpOk) {
  logger.info({ user: process.env.SMTP_USER }, "SMTP ready");
} else {
  logger.warn(
    "SMTP not configured or Gmail rejected credentials — OTP emails will fail until SMTP_USER/SMTP_PASS are set in .env",
  );
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
