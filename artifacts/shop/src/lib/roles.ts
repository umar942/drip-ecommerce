import type { User } from "@workspace/api-client-react";

export function isAdminRole(role: User["role"]): boolean {
  return role === "admin" || role === "staff";
}
