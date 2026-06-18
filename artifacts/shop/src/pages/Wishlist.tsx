import { useGetWishlist, useRemoveFromWishlist, useAddToCart, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, HeartCrack } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Wishlist() {
  const { data: wishlistItems, isLoading } = useGetWishlist();
  const removeMutation = useRemoveFromWishlist();
  const addToCartMutation = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  const items = wishlistItems || [];

  const handleRemove = (productId: number) => {
    removeMutation.mutate({ data: { productId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({ title: "Removed from wishlist" });
      }
    });
  };

  const handleAddToCart = (productId: number) => {
    addToCartMutation.mutate({ data: { productId, quantity: 1 } }, {
      onSuccess: () => {
        toast({ title: "Added to cart" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-8">Wishlist</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-border/40">
          <HeartCrack className="h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-8">Save items you like to view them later.</p>
          <Link href="/products">
            <Button className="rounded-none h-14 px-8 uppercase tracking-widest font-bold">Discover Products</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {items.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={item.id} 
              className="group relative flex flex-col gap-3"
            >
              <Link href={`/products/${item.productId}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary/20">
                <img 
                  src={item.product.images?.[0] || "/images/product-tshirt.png"} 
                  alt={item.product.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
              
              <div className="flex flex-col gap-1">
                <Link href={`/products/${item.productId}`} className="font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1">
                  {item.product.title}
                </Link>
                <span className="font-bold">${item.product.price.toFixed(2)}</span>
              </div>

              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={() => handleAddToCart(item.productId)}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 rounded-none uppercase text-xs tracking-widest font-bold"
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleRemove(item.productId)}
                  disabled={removeMutation.isPending}
                  className="rounded-none border-border/40 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
