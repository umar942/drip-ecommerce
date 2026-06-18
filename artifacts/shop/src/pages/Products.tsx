import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ProductCard } from "@/components/shared/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Products() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const categoryParam = searchParams.get("category");
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(categoryParam || "all");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: productsData, isLoading } = useListProducts({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const products = productsData?.products || [];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">Collection</h1>
          <p className="text-muted-foreground mt-2">Explore our premium streetwear selection.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-none border-border/40 focus-visible:ring-primary bg-background"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-none border-border/40 md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-4 border-b border-border/40 pb-2">Category</h3>
            <div className="space-y-2">
              {['all', 't-shirts', 'hoodies', 'bottoms', 'accessories'].map((cat) => (
                <div key={cat} className="flex items-center">
                  <button
                    onClick={() => setCategory(cat)}
                    className={`text-sm uppercase tracking-wider transition-colors ${category === cat ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {cat.replace('-', ' ')}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-4 border-b border-border/40 pb-2">Price Range</h3>
            <div className="px-2">
              <Slider
                defaultValue={[0, 500]}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="aspect-[3/4] bg-secondary/50 animate-pulse"></div>
                  <div className="h-5 w-2/3 bg-secondary/50 animate-pulse"></div>
                  <div className="h-4 w-1/3 bg-secondary/50 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-2">No Products Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-none uppercase tracking-wider"
                onClick={() => { setSearch(""); setCategory("all"); setPriceRange([0, 500]); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
