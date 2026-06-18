import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  children,
  adminOnly = false,
  loginPath = "/login",
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  loginPath?: string;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        const redirect = encodeURIComponent(location);
        setLocation(`${loginPath}?redirect=${redirect}`);
      } else if (adminOnly && !isAdminRole(user.role)) {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation, adminOnly, location, loginPath]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && !isAdminRole(user.role)) return null;

  return <>{children}</>;
}
