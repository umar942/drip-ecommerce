import { useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
<<<<<<< HEAD
import { formatPrice } from "@/lib/currency";
=======
import { formatPKR } from "@/lib/pakistan";
>>>>>>> 76338c17e7b6863973759898537571a6d9815001

export default function AdminProducts() {
  const { data: productsData, isLoading } = useListProducts();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground uppercase tracking-widest text-sm">Loading Products...</div>;
  }

  const products = productsData?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Products</h1>
        <Button className="rounded-none uppercase tracking-widest text-xs font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="border border-border/40 bg-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 bg-secondary/20">
              <tr>
                <th className="px-4 py-4 font-normal w-16">Image</th>
                <th className="px-4 py-4 font-normal">Product</th>
                <th className="px-4 py-4 font-normal">Category</th>
                <th className="px-4 py-4 font-normal">Price</th>
                <th className="px-4 py-4 font-normal">Stock</th>
                <th className="px-4 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map(product => (
                <tr key={product.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 bg-secondary/40">
                      {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{product.title}</td>
                  <td className="px-4 py-3 uppercase tracking-wider text-xs">{product.category}</td>
<<<<<<< HEAD
                  <td className="px-4 py-3">{formatPrice(product.price)}</td>
=======
                  <td className="px-4 py-3">{formatPKR(product.price)}</td>
>>>>>>> 76338c17e7b6863973759898537571a6d9815001
                  <td className="px-4 py-3">
                    <span className={`${product.stock > 0 ? 'text-green-500' : 'text-destructive'} font-mono`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider">Edit</Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
