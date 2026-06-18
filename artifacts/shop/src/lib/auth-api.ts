import type { User } from "@workspace/api-client-react";

type OtpPurpose = "signup" | "reset";

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data as T;
}

export async function sendOtp(email: string, purpose: OtpPurpose): Promise<{ message: string }> {
  return apiPost("/auth/send-otp", { email, purpose });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiPost("/auth/forgot-password", { email });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiPost("/auth/reset-password", { email, code, newPassword });
}

export async function registerWithOtp(data: {
  name: string;
  email: string;
  password: string;
  code: string;
}): Promise<{ token: string; user: User }> {
  return apiPost("/auth/register", data);
}
