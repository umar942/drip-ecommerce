import { useEffect, useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const { login, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdminRole(user.role)) {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (!isAdminRole(data.user.role)) {
            toast({
              title: "Not an admin account",
              description: "Use the customer login for shopping.",
              variant: "destructive",
            });
            return;
          }
          login(data.token, data.user);
          toast({ title: "Welcome back", description: "Admin panel loaded." });
          setLocation("/admin");
        },
        onError: (err) => {
          toast({
            title: "Login failed",
            description: err.message || "Invalid credentials",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border/40 bg-secondary/10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 flex items-center justify-center border border-primary/40 bg-primary/10 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tighter text-primary uppercase mb-2">DRIP</h1>
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Store management only. Customers sign in on the shop site.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40"
            />
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In to Admin"}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Shopping as a customer?{" "}
          <Link href="/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Customer Login
          </Link>
        </p>
      </div>
    </div>
  );
}
