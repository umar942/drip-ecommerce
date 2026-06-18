import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrderDetail() {
  const { id } = useParams();
  
  const { data: order, isLoading } = useGetOrder(Number(id), {
    query: {
      queryKey: getGetOrderQueryKey(Number(id)),
      enabled: !!id,
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold uppercase mb-4">Order Not Found</h1>
        <Link href="/orders"><Button variant="outline" className="rounded-none">Back to Orders</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
      <div className="mb-6">
        <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-2">Order #{order.id}</h1>
          <p className="text-muted-foreground">Placed on {format(new Date(order.createdAt), "PPP 'at' p")}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="uppercase tracking-widest rounded-none text-sm px-3 py-1">
            Status: {order.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2">Items</h2>
          <div className="flex flex-col gap-4">
            {order.items?.map(item => (
              <div key={item.id} className="flex gap-4 p-4 border border-border/40 bg-secondary/5">
                <div className="w-20 aspect-[3/4] shrink-0 bg-secondary/20">
                  <img src={item.product?.images?.[0] || "/images/product-tshirt.png"} alt={item.product?.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <Link href={`/products/${item.productId}`} className="font-bold uppercase tracking-tight hover:text-primary transition-colors">
                    {item.product?.title}
                  </Link>
                  <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold mt-2">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2 mb-4">Summary</h2>
            <div className="bg-secondary/10 p-4 border border-border/40 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border/40 font-bold text-lg">
                <span>Total</span>
                <span>${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight border-b border-border/40 pb-2 mb-4">Shipping Address</h2>
            <div className="bg-secondary/10 p-4 border border-border/40 text-sm">
              {order.address ? (
                <>
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                  <p>{order.address.country}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No address provided</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
