import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/lib/cart";

export default function Cart() {
  const [, setLocation] = useLocation();
  const cart = useCart();
  const { items, total, itemCount, isLoading } = cart;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  const handleUpdateQuantity = (itemId: number | string, quantity: number) => {
    if (quantity < 1) return;
    cart.updateItem(itemId, quantity);
  };

  const handleRemoveItem = (itemId: number | string) => {
    cart.removeItem(itemId);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
      <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-8">Your Bag</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-border/40">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/products">
            <Button className="rounded-none h-14 px-8 uppercase tracking-widest font-bold">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 flex flex-col gap-6">
            {items.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={item.id} 
                className="flex gap-4 md:gap-6 pb-6 border-b border-border/40"
              >
                <Link href={`/products/${item.productId}`} className="shrink-0">
                  <div className="w-24 md:w-32 aspect-[3/4] bg-secondary/20">
                    <img 
                      src={item.product.images?.[0] || "/images/product-tshirt.png"} 
                      alt={item.product.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/products/${item.productId}`} className="font-bold uppercase tracking-tight hover:text-primary transition-colors text-lg md:text-xl">
                        {item.product.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                    </div>
                    <span className="font-bold">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                  
                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex items-center border border-border/40 h-10 w-max">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
                      >-</button>
                      <div className="w-10 h-full flex items-center justify-center font-bold text-center border-x border-border/40 text-sm">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
                      >+</button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-secondary/10 border border-border/40 p-6 flex flex-col gap-6 sticky top-24">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight border-b border-border/40 pb-4">Order Summary</h2>
              
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
                <span className="font-bold uppercase tracking-wider">Estimated Total</span>
                <span className="font-bold text-xl">{formatPrice(total)}</span>
              </div>
              
              <Button 
                onClick={() => setLocation("/checkout")} 
                className="w-full h-14 rounded-none uppercase tracking-widest font-bold text-sm mt-4"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
