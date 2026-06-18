import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  if (!user || !isAdminRole(user.role)) return null;

  const navLink = (href: string, label: string, Icon: typeof LayoutDashboard) => {
    const active = location === href || (href !== "/admin" && location.startsWith(href));
    return (
      <Link href={href}>
        <a
          className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            active
              ? "text-primary bg-primary/10 border-l-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </a>
      </Link>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 border-r border-border/40 shrink-0 bg-secondary/10">
        <div className="p-6 border-b border-border/40">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary">Command Center</h2>
        </div>
        <nav className="p-4 space-y-1">
          {navLink("/admin", "Overview", LayoutDashboard)}
          {navLink("/admin/products", "Products", Package)}
          {navLink("/admin/orders", "Orders", ShoppingCart)}
          {navLink("/admin/users", "Users", Users)}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
