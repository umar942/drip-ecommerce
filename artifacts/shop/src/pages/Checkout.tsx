import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetCart, useCreateOrder, getGetCartQueryKey, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const createOrder = useCreateOrder();

  const [formData, setFormData] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  if (!cart || cart.items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // In a real app we would create the address first, then pass addressId
    // For mockup, we'll mock the mutation
    createOrder.mutate({
      data: {
        addressId: 1, // Mock
        paymentMethod: "card",
      }
    }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order Placed", description: "Your order has been successfully placed." });
        setLocation(`/orders/${order.id}`);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2">Shipping Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required className="rounded-none bg-background border-border/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required className="rounded-none bg-background border-border/40" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line1">Address</Label>
                <Input 
                  id="line1" 
                  value={formData.line1}
                  onChange={e => setFormData(p => ({...p, line1: e.target.value}))}
                  required 
                  className="rounded-none bg-background border-border/40" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={formData.city}
                    onChange={e => setFormData(p => ({...p, city: e.target.value}))}
                    required 
                    className="rounded-none bg-background border-border/40" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input 
                    id="state" 
                    value={formData.state}
                    onChange={e => setFormData(p => ({...p, state: e.target.value}))}
                    required 
                    className="rounded-none bg-background border-border/40" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP / Postal Code</Label>
                  <Input 
                    id="zip" 
                    value={formData.zip}
                    onChange={e => setFormData(p => ({...p, zip: e.target.value}))}
                    required 
                    className="rounded-none bg-background border-border/40" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    value={formData.country}
                    onChange={e => setFormData(p => ({...p, country: e.target.value}))}
                    required 
                    className="rounded-none bg-background border-border/40" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2">Payment</h2>
              <div className="p-4 border border-border/40 bg-secondary/10 text-center text-muted-foreground text-sm">
                Mockup environment. No real payment required.
              </div>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-secondary/10 border border-border/40 p-6 flex flex-col gap-6 sticky top-24">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-4">Order Summary</h2>
            
            <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 aspect-[3/4] bg-secondary/20 shrink-0">
                    <img src={item.product.images?.[0]} alt={item.product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-sm font-bold line-clamp-1">{item.product.title}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                    <span className="text-sm font-bold mt-1">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-3 text-sm border-t border-border/40 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
              <span className="font-bold uppercase tracking-wider">Total</span>
              <span className="font-bold text-xl">${cart.total.toFixed(2)}</span>
            </div>
            
            <Button 
              type="submit"
              form="checkout-form"
              disabled={createOrder.isPending}
              className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm mt-4"
            >
              {createOrder.isPending ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
