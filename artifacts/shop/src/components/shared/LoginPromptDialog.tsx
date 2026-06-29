import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoginPrompt } from "@/lib/login-prompt";

export function LoginPromptDialog() {
  const { open, close } = useLoginPrompt();
  const [location, setLocation] = useLocation();

  const handleLogin = () => {
    close();
    setLocation(`/login?redirect=${encodeURIComponent(location)}`);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md rounded-none border-border/40">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-tight">
            Log in for faster checkout
          </DialogTitle>
          <DialogDescription>
            Sign in to save your cart, track orders, and check out faster next time. Or keep
            shopping as a guest — your cart is already saved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            className="rounded-none uppercase tracking-widest text-xs"
          >
            Continue as Guest
          </Button>
          <Button
            type="button"
            onClick={handleLogin}
            className="rounded-none uppercase tracking-widest text-xs font-bold"
          >
            Log In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
