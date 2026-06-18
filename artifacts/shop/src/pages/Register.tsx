import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { sendOtp, registerWithOtp } from "@/lib/auth-api";

export default function Register() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await sendOtp(email, "signup");
      toast({
        title: "Code sent",
        description: `Check ${email} (and Spam/Promotions) for your 6-digit code.`,
      });
      setStep("otp");
    } catch (err) {
      toast({
        title: "Could not send code",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await registerWithOtp({ name, email, password, code });
      login(data.token, data.user);
      toast({ title: "Account created", description: "Welcome to the DRIP family." });
      setLocation("/");
    } catch (err) {
      toast({
        title: "Registration failed",
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
          <h2 className="text-xl font-bold uppercase tracking-wider text-foreground">Create Identity</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === "form" ? "Step 1 — Your details" : "Step 2 — Verify email"}
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-none h-12 bg-background border-border/40" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm">
              {loading ? "Sending code..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              We sent a code to <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Not there? Check Spam or Promotions, or wait 1 minute and resend.
            </p>
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
            <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm">
              {loading ? "Creating..." : "Verify & Join"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-none"
              disabled={loading}
              onClick={() => handleSendOtp()}
            >
              {loading ? "Sending..." : "Resend code"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={() => setStep("form")}>
              Change email
            </Button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-foreground hover:text-primary uppercase tracking-wider underline underline-offset-4">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
