import { Link } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 border-r border-border/40 shrink-0 bg-secondary/10">
        <div className="p-6 border-b border-border/40">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary">Command Center</h2>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/admin">
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </a>
          </Link>
          <Link href="/admin/products">
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
              <Package className="h-4 w-4" />
              Products
            </a>
          </Link>
          <Link href="/admin/orders">
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </a>
          </Link>
          <Link href="/admin/users">
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
              <Users className="h-4 w-4" />
              Users
            </a>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
