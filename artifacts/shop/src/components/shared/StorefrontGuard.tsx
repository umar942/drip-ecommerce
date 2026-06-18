import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";

/** Keeps admins on the admin panel — not the customer storefront. */
export function StorefrontGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && isAdminRole(user.role)) {
      setLocation("/admin");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full" />
      </div>
    );
  }

  if (user && isAdminRole(user.role)) return null;

  return <>{children}</>;
}
