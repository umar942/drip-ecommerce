import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-3xl font-bold tracking-tighter text-primary">DRIP</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Premium streetwear for Pakistan. Delivering nationwide in PKR.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-display font-semibold mb-4 text-foreground">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/products?category=new" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?category=T-Shirts" className="hover:text-primary transition-colors">T-Shirts</Link></li>
              <li><Link href="/products?category=Trousers" className="hover:text-primary transition-colors">Trousers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-display font-semibold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Shipping (Pakistan)</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Returns</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-display font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DRIP Pakistan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
