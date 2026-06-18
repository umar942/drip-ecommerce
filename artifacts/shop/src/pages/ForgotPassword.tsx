import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast({ title: "Check your email", description: "If registered, you'll receive a reset code." });
    } catch (err) {
      toast({
        title: "Request failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md border border-border/40 bg-secondary/10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tighter text-primary uppercase mb-2">DRIP</h1>
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Forgot Password</h2>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
            <p className="text-muted-foreground text-sm">
              If <span className="text-foreground font-medium">{email}</span> is registered, we sent a 6-digit reset code.
              Check Spam/Promotions if you do not see it within a minute.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              <Button className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm">
                Enter Reset Code
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm">
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
