import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/currency";

export default function AdminOrders() {
  const { data: orders, isLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground uppercase tracking-widest text-sm">Loading Orders...</div>;
  }

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate(
      { id, data: { status: status as OrderStatusUpdateStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Status updated" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Orders</h1>

      <div className="border border-border/40 bg-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 bg-secondary/20">
              <tr>
                <th className="px-4 py-4 font-normal">Order ID</th>
                <th className="px-4 py-4 font-normal">Customer</th>
                <th className="px-4 py-4 font-normal">Date</th>
                <th className="px-4 py-4 font-normal">Total</th>
                <th className="px-4 py-4 font-normal w-40">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders && orders.length > 0 ? orders.map(order => (
                <tr key={order.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold">#{order.id}</td>
                  <td className="px-4 py-4">{order.user?.name || order.guestName || `User ${order.userId}`}</td>
                  <td className="px-4 py-4 text-muted-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                  <td className="px-4 py-4 font-bold">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                      <SelectTrigger className="h-8 rounded-none border-border/40 text-xs uppercase tracking-wider font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border/40">
                        <SelectItem value="pending" className="text-xs uppercase tracking-wider">Pending</SelectItem>
                        <SelectItem value="processing" className="text-xs uppercase tracking-wider">Processing</SelectItem>
                        <SelectItem value="shipped" className="text-xs uppercase tracking-wider">Shipped</SelectItem>
                        <SelectItem value="delivered" className="text-xs uppercase tracking-wider">Delivered</SelectItem>
                        <SelectItem value="cancelled" className="text-xs uppercase tracking-wider">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
