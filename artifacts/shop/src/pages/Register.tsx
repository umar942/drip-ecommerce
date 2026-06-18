import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const registerMutation = useRegister();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { name, email, password } }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({ title: "Account created", description: "Welcome to the DRIP family." });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Registration failed", description: err.message || "Something went wrong", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md border border-border/40 bg-secondary/10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tighter text-primary uppercase mb-2">DRIP</h1>
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Create Identity</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Full Name</Label>
            <Input 
              id="name" 
              required 
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40" 
            />
          </div>
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
            <Label htmlFor="password" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-none h-12 bg-background border-border/40" 
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={registerMutation.isPending}
            className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm"
          >
            {registerMutation.isPending ? "Creating..." : "Join Now"}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
