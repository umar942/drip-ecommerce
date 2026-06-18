import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetCart } from "@workspace/api-client-react";
import { ShoppingBag, User, Heart, Menu, X, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: cart } = useGetCart({
    query: {
      enabled: !!user,
    }
  });

  const cartItemCount = cart?.itemCount || 0;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tighter text-primary">DRIP</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:text-primary text-foreground/80">
              Shop All
            </Link>
            <Link href="/products?category=t-shirts" className="transition-colors hover:text-primary text-foreground/80">
              T-Shirts
            </Link>
            <Link href="/products?category=hoodies" className="transition-colors hover:text-primary text-foreground/80">
              Hoodies
            </Link>
            <Link href="/products?category=bottoms" className="transition-colors hover:text-primary text-foreground/80">
              Bottoms
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
                      <Shield className="h-5 w-5" />
                      <span className="sr-only">Admin</span>
                    </Button>
                  </Link>
                )}
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Wishlist</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-primary">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-foreground/80 hover:text-primary">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="text-foreground/80 hover:text-primary font-medium">
                  Log In
                </Button>
              </Link>
            )}
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-primary">
                <ShoppingBag className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/40 p-4 shadow-lg"
          >
            <nav className="flex flex-col space-y-4">
              <Link href="/products" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Shop All
              </Link>
              <Link href="/products?category=t-shirts" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                T-Shirts
              </Link>
              <Link href="/products?category=hoodies" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Hoodies
              </Link>
              <Link href="/products?category=bottoms" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Bottoms
              </Link>
              <div className="h-px bg-border/40 my-2" />
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/profile" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link href="/wishlist" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    Wishlist
                  </Link>
                  <Link href="/orders" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    Orders
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-lg font-medium text-left text-destructive">
                    Log Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  Log In / Register
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
