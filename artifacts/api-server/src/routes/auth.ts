import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { usersRepo, otpRepo } from "@workspace/db";
import { signToken, requireAuth, type AuthRequest } from "../lib/auth";
import { sendOtpEmail } from "../lib/email";
import { logger } from "../lib/logger";
import { LoginBody } from "@workspace/api-zod";

const router = Router();

const SendOtpBody = z.object({
  email: z.string().email(),
  purpose: z.enum(["signup", "reset"]),
});

const RegisterBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().length(6),
});

const ResetPasswordBody = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

const ForgotPasswordBody = z.object({
  email: z.string().email(),
});

function formatUser(user: Awaited<ReturnType<typeof usersRepo.findUserById>>) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified ?? true,
    createdAt: user.createdAt,
  };
}

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, purpose } = parsed.data;

  if (purpose === "signup") {
    const existing = await usersRepo.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
  } else {
    const user = await usersRepo.findUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: "If that email is registered, a verification code has been sent." });
      return;
    }
  }

  const canResend = await otpRepo.canResendOtp(email, purpose);
  if (!canResend) {
    res.status(429).json({ error: "Please wait a minute before requesting another code." });
    return;
  }

  const code = otpRepo.generateOtpCode();
  await otpRepo.createOtp(email, purpose, code);

  try {
    await sendOtpEmail(email, purpose, code);
  } catch (err) {
    logger.error({ err, email, purpose }, "Failed to send OTP email");
    const hint =
      err instanceof Error && err.message.includes("Invalid login")
        ? "Gmail rejected the app password. Create a new App Password at myaccount.google.com/apppasswords and update SMTP_PASS in .env, then restart the API."
        : "Failed to send verification email. Check SMTP settings in .env and restart the API server.";
    res.status(500).json({ error: hint });
    return;
  }

  res.json({ message: "Verification code sent to your email." });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, code } = parsed.data;

  const existing = await usersRepo.findUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const verification = await otpRepo.verifyOtp(email, "signup", code);
  if (!verification.ok) {
    res.status(400).json({ error: verification.error });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await usersRepo.createUser({
    name,
    email,
    passwordHash,
    emailVerified: true,
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({
    token,
    user: formatUser(user),
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await usersRepo.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.emailVerified === false) {
    res.status(403).json({ error: "Please verify your email before logging in." });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: formatUser(user),
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email } = parsed.data;
  const user = await usersRepo.findUserByEmail(email);

  if (user) {
    const canResend = await otpRepo.canResendOtp(email, "reset");
    if (canResend) {
      const code = otpRepo.generateOtpCode();
      await otpRepo.createOtp(email, "reset", code);
      try {
        await sendOtpEmail(email, "reset", code);
      } catch (err) {
        logger.error({ err, email }, "Failed to send reset email");
        res.status(500).json({ error: "Failed to send reset email. Check SMTP settings in .env." });
        return;
      }
    }
  }

  res.json({ message: "If that email is registered, a reset code has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, code, newPassword } = parsed.data;

  const user = await usersRepo.findUserByEmail(email);
  if (!user) {
    res.status(400).json({ error: "Invalid reset request." });
    return;
  }

  const verification = await otpRepo.verifyOtp(email, "reset", code);
  if (!verification.ok) {
    res.status(400).json({ error: verification.error });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await usersRepo.updateUserPassword(email, passwordHash);

  res.json({ message: "Password updated successfully. You can now log in." });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  res.json(formatUser(authReq.user));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out" });
});

export default router;
