import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">Order History</h1>

      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="border border-border/40 bg-secondary/10 p-6 hover:border-primary transition-colors cursor-pointer flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-sm">Order #{order.id}</span>
                  <span className="text-muted-foreground">{format(new Date(order.createdAt), "PPP")}</span>
                  <span className="font-bold mt-2">{formatPrice(order.totalPrice)}</span>
                </div>
                
                <div className="flex flex-col sm:items-end justify-between">
                  <div className="flex gap-2">
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="uppercase tracking-widest rounded-none">
                      {order.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground mt-4 sm:mt-0">{order.items?.length || 0} Items</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-border/40 bg-secondary/10">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">No orders yet</h2>
          <p className="text-muted-foreground">When you place an order, it will appear here.</p>
        </div>
      )}
    </div>
  );
}
