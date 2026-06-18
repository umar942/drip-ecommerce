import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
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
      }
    }
  }, [user, isLoading, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        if (isAdminRole(data.user.role)) {
          toast({
            title: "Admin account",
            description: "Please sign in at the admin portal.",
            variant: "destructive",
          });
          setLocation("/admin/login");
          return;
        }
        login(data.token, data.user);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        if (redirect && redirect.startsWith("/") && !redirect.startsWith("/admin")) {
          setLocation(redirect);
        } else {
          setLocation("/");
        }
      },
      onError: (err) => {
        toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md border border-border/40 bg-secondary/10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tighter text-primary uppercase mb-2">DRIP</h1>
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Account Access</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Email</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline">Forgot?</Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40" 
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loginMutation.isPending}
            className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Create One
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Store admin?{" "}
          <Link href="/admin/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Admin Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
