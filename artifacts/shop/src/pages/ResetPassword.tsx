import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/lib/auth-api";

export default function ResetPassword() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      toast({ title: "Password updated", description: "You can sign in with your new password." });
      setLocation("/login");
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Invalid or expired code",
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
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Reset Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
          </div>
          <div className="space-y-2">
            <Label className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Reset Code</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">New Password</Label>
            <Input id="newPassword" type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
