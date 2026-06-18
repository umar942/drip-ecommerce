import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  useGetCart,
  useCreateOrder,
  useAddUserAddress,
  getGetCartQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/currency";
import {
  STORE_COUNTRY,
  PK_PROVINCES,
  isValidPakistanPostalCode,
} from "@/lib/pakistan";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const createOrder = useCreateOrder();
  const addAddress = useAddUserAddress();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });

  if (!cart || cart.items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.state) {
      toast({ title: "Province required", description: "Please select your province.", variant: "destructive" });
      return;
    }
    if (!isValidPakistanPostalCode(formData.zip)) {
      toast({
        title: "Invalid postal code",
        description: "Enter a valid 5-digit Pakistan postal code.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const address = await addAddress.mutateAsync({
        id: user.id,
        data: {
          line1: formData.line1,
          line2: formData.line2 || undefined,
          city: formData.city,
          state: formData.state,
          country: STORE_COUNTRY,
          zip: formData.zip.trim(),
          isDefault: true,
        },
      });

      const order = await createOrder.mutateAsync({
        data: {
          addressId: address.id,
          paymentMethod: "card",
        },
      });

      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast({ title: "Order placed", description: "Your order will be delivered within Pakistan." });
      setLocation(`/orders/${order.id}`);
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Could not place your order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-2">Checkout</h1>
      <p className="text-sm text-muted-foreground mb-8">Delivery available across Pakistan only.</p>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2">
                Delivery Address (Pakistan)
              </h2>

              <div className="space-y-2">
                <Label htmlFor="line1">Street Address</Label>
                <Input
                  id="line1"
                  placeholder="House / flat, street, area"
                  value={formData.line1}
                  onChange={(e) => setFormData((p) => ({ ...p, line1: e.target.value }))}
                  required
                  className="rounded-none bg-background border-border/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
                <Input
                  id="line2"
                  value={formData.line2}
                  onChange={(e) => setFormData((p) => ({ ...p, line2: e.target.value }))}
                  className="rounded-none bg-background border-border/40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Karachi, Lahore, Islamabad"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    required
                    className="rounded-none bg-background border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Province</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData((p) => ({ ...p, state: value }))}
                    required
                  >
                    <SelectTrigger id="state" className="rounded-none bg-background border-border/40">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PK_PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">Postal Code</Label>
                  <Input
                    id="zip"
                    placeholder="5-digit code"
                    inputMode="numeric"
                    maxLength={5}
                    value={formData.zip}
                    onChange={(e) => setFormData((p) => ({ ...p, zip: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                    required
                    className="rounded-none bg-background border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={STORE_COUNTRY}
                    readOnly
                    disabled
                    className="rounded-none bg-secondary/20 border-border/40"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2">Payment</h2>
              <div className="p-4 border border-border/40 bg-secondary/10 text-center text-muted-foreground text-sm">
                Cash on delivery and card payments accepted (demo — no real charge).
              </div>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-secondary/10 border border-border/40 p-6 flex flex-col gap-6 sticky top-24">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-4">
              Order Summary
            </h2>

            <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 aspect-[3/4] bg-secondary/20 shrink-0">
                    <img src={item.product.images?.[0]} alt={item.product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-sm font-bold line-clamp-1">{item.product.title}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                    <span className="text-sm font-bold mt-1">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 text-sm border-t border-border/40 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping (Pakistan)</span>
                <span>Free</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
              <span className="font-bold uppercase tracking-wider">Total (PKR)</span>
              <span className="font-bold text-xl">{formatPrice(cart.total)}</span>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm mt-4"
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
