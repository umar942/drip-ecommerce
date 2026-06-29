import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id || !email.trim()) return;
    setLocation(`/orders/${id}?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-md">
      <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-2">Track Your Order</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Enter your order number and the email you used at checkout.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderId">Order Number</Label>
          <Input
            id="orderId"
            inputMode="numeric"
            placeholder="e.g. 1024"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
            required
            className="rounded-none border-border/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-none border-border/40"
          />
        </div>
        <Button type="submit" className="h-12 rounded-none uppercase tracking-widest font-bold text-sm mt-2">
          Track Order
        </Button>
      </form>
    </div>
  );
}
