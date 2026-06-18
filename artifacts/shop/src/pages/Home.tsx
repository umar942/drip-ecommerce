import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/ProductCard";
import { motion } from "framer-motion";

export default function Home() {
  const { data: productsData, isLoading } = useListProducts({ limit: 8 });
  const featuredProducts = productsData?.products || [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-black flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-display text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-white drop-shadow-xl uppercase mb-6"
          >
            Define Your <span className="text-primary">Identity</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10"
          >
            Premium streetwear designed for the bold. Uncompromising quality. Unapologetic aesthetic.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/products">
              <Button size="lg" className="h-14 px-10 text-lg font-bold uppercase tracking-wider bg-white text-black hover:bg-primary hover:text-white transition-all duration-300 rounded-none">
                Shop New Arrivals
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32 container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground">New Drop</h2>
            <p className="text-muted-foreground mt-2 text-lg">The latest additions to our collection.</p>
          </div>
          <Link href="/products">
            <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider font-semibold">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[3/4] bg-secondary/50 animate-pulse"></div>
                <div className="h-5 w-2/3 bg-secondary/50 animate-pulse"></div>
                <div className="h-4 w-1/3 bg-secondary/50 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {featuredProducts.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/products?category=t-shirts" className="group relative h-[400px] overflow-hidden bg-black flex items-center justify-center">
              <img src="/images/product-tshirt.png" alt="T-Shirts" className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
              <h3 className="relative z-10 font-display text-3xl font-bold text-white uppercase tracking-widest drop-shadow-md group-hover:text-primary transition-colors">T-Shirts</h3>
            </Link>
            <Link href="/products?category=hoodies" className="group relative h-[400px] overflow-hidden bg-black flex items-center justify-center">
              <img src="/images/product-hoodie.png" alt="Hoodies" className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
              <h3 className="relative z-10 font-display text-3xl font-bold text-white uppercase tracking-widest drop-shadow-md group-hover:text-primary transition-colors">Hoodies</h3>
            </Link>
            <Link href="/products?category=bottoms" className="group relative h-[400px] overflow-hidden bg-black flex items-center justify-center">
              <img src="/images/product-trousers.png" alt="Bottoms" className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
              <h3 className="relative z-10 font-display text-3xl font-bold text-white uppercase tracking-widest drop-shadow-md group-hover:text-primary transition-colors">Bottoms</h3>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
