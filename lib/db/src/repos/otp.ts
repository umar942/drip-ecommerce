import crypto from "node:crypto";
import { getDb } from "../connection";
import { nextId } from "../counter";

const COL = "otps";

export type OtpPurpose = "signup" | "reset";

export interface OtpRecord {
  id: number;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string): string {
  const secret = process.env.SESSION_SECRET ?? "otp-fallback-secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function canResendOtp(email: string, purpose: OtpPurpose): Promise<boolean> {
  const latest = await getDb()
    .collection<OtpRecord>(COL)
    .findOne({ email, purpose }, { sort: { createdAt: -1 } });
  if (!latest) return true;
  return Date.now() - latest.createdAt.getTime() >= RESEND_COOLDOWN_MS;
}

export async function createOtp(email: string, purpose: OtpPurpose, code: string): Promise<void> {
  await getDb().collection<OtpRecord>(COL).deleteMany({ email, purpose });

  const record: OtpRecord = {
    id: await nextId(COL),
    email,
    purpose,
    codeHash: hashCode(code),
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    createdAt: new Date(),
  };
  await getDb().collection<OtpRecord>(COL).insertOne(record);
}

export async function verifyOtp(
  email: string,
  purpose: OtpPurpose,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const record = await getDb()
    .collection<OtpRecord>(COL)
    .findOne({ email, purpose }, { sort: { createdAt: -1 } });

  if (!record) {
    return { ok: false, error: "No verification code found. Please request a new one." };
  }

  if (record.expiresAt < new Date()) {
    await getDb().collection<OtpRecord>(COL).deleteOne({ id: record.id });
    return { ok: false, error: "Verification code expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many failed attempts. Please request a new code." };
  }

  const valid = record.codeHash === hashCode(code);
  if (!valid) {
    await getDb().collection<OtpRecord>(COL).updateOne(
      { id: record.id },
      { $inc: { attempts: 1 } },
    );
    return { ok: false, error: "Invalid verification code." };
  }

  await getDb().collection<OtpRecord>(COL).deleteOne({ id: record.id });
  return { ok: true };
}
