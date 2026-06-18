import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/currency";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const mainImage = product.images?.[0] || "/images/product-tshirt.png";
  const hoverImage = product.images?.[1] || mainImage;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex flex-col gap-3"
    >
      <Link href={`/products/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary/20">
        <div className="absolute inset-0 z-10 transition-opacity duration-300 group-hover:opacity-0">
          <img 
            src={mainImage} 
            alt={product.title} 
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <img 
            src={hoverImage} 
            alt={product.title} 
            className="h-full w-full object-cover object-center scale-105 transition-transform duration-700 group-hover:scale-100"
            loading="lazy"
          />
        </div>
        
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute top-3 left-3 z-20 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-bold uppercase tracking-wider">
            Sale
          </div>
        )}
      </Link>
      
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <Link href={`/products/${product.id}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
            {product.title}
          </Link>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{product.category}</p>
      </div>
    </motion.div>
  );
}
