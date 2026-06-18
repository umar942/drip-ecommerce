import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminNavbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tighter text-primary">DRIP</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground border border-border/40 px-2 py-0.5">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="uppercase tracking-widest text-xs font-bold gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
