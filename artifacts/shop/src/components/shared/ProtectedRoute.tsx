import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        const redirect = encodeURIComponent(location);
        setLocation(`/login?redirect=${redirect}`);
      } else if (adminOnly && user.role !== "admin") {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation, adminOnly, location]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;

  return <>{children}</>;
}
