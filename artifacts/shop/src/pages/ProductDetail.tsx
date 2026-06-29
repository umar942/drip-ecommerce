import { useGetProduct, useAddToWishlist, getGetWishlistQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useLoginPrompt } from "@/lib/login-prompt";
import { ShoppingBag, Heart, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/currency";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cart = useCart();
  const { maybePrompt } = useLoginPrompt();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: {
      queryKey: getGetProductQueryKey(Number(id)),
      enabled: !!id,
    },
  });

  const addToWishlist = useAddToWishlist();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">Product Not Found</h1>
        <Button onClick={() => setLocation("/products")} className="mt-6 rounded-none">Back to Shop</Button>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }

    if (product.colors?.length && !selectedColor) {
      toast({ title: "Please select a color", variant: "destructive" });
      return;
    }

    setIsAddingToCart(true);
    try {
      await cart.addItem({
        productId: product.id,
        quantity,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        product,
      });
      toast({ title: "Added to cart", description: `${product.title} has been added to your cart.` });
      if (!user) maybePrompt();
    } catch (err) {
      toast({
        title: "Could not add to cart",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    addToWishlist.mutate({
      data: { productId: product.id }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({ title: "Added to wishlist", description: "Item saved for later." });
      }
    });
  };

  const images = product.images?.length ? product.images : ["/images/product-tshirt.png"];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Images */}
        <div className="w-full lg:w-3/5 flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 shrink-0">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setMainImageIdx(idx)}
                className={`aspect-[3/4] w-20 md:w-full shrink-0 border-2 transition-colors ${idx === mainImageIdx ? 'border-primary' : 'border-transparent hover:border-border/50'}`}
              >
                <img src={img} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={mainImageIdx}
            className="flex-1 aspect-[3/4] bg-secondary/20"
          >
            <img src={images[mainImageIdx]} alt={product.title} className="w-full h-full object-cover" />
          </motion.div>
        </div>

        {/* Info */}
        <div className="w-full lg:w-2/5 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground">{product.category}</div>
            <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight">{product.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <p>{product.description || "Premium streetwear piece."}</p>
          </div>

          <div className="flex flex-col gap-6 pt-6 border-t border-border/40">
            {product.colors && product.colors.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider">Color: {selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 px-4 border ${selectedColor === color ? 'border-primary text-primary' : 'border-border/40 text-foreground hover:border-foreground'} uppercase text-xs font-bold tracking-wider transition-colors`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider">Size: {selectedSize}</span>
                  <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 min-w-12 px-4 border ${selectedSize === size ? 'bg-primary text-primary-foreground border-primary' : 'border-border/40 text-foreground hover:border-foreground'} font-bold uppercase tracking-wider transition-all`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <span className="text-sm font-bold uppercase tracking-wider">Quantity</span>
              <div className="flex items-center border border-border/40 w-max h-12">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
                >-</button>
                <div className="w-12 h-full flex items-center justify-center font-bold text-center border-x border-border/40">{quantity}</div>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-12 h-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock <= 0}
                className="flex-1 h-14 rounded-none text-sm font-bold uppercase tracking-widest"
              >
                {isAddingToCart ? <div className="h-5 w-5 animate-spin border-y-2 border-primary-foreground rounded-full" /> :
                  product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button 
                onClick={handleAddToWishlist}
                disabled={addToWishlist.isPending}
                variant="outline" 
                className="h-14 w-full sm:w-14 shrink-0 rounded-none border-border/40"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
              {product.stock > 0 ? (
                <><Check className="h-4 w-4 text-green-500" /> In stock and ready to ship</>
              ) : (
                <span className="text-destructive">Currently unavailable</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
