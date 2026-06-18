import { ReactNode } from "react";
import { AdminNavbar } from "./AdminNavbar";

export function AdminAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <AdminNavbar />
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
