import { useGetAdminStats, useGetRecentOrders } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { formatPrice } from "@/lib/currency";

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useGetRecentOrders();

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="h-8 w-8 animate-spin border-y-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatPrice(stats.totalRevenue) },
          { label: "Total Orders", value: stats.totalOrders },
          { label: "Active Products", value: stats.totalProducts },
          { label: "Registered Users", value: stats.totalUsers },
        ].map((stat, i) => (
          <div key={i} className="border border-border/40 bg-secondary/10 p-6 flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</span>
            <span className="text-3xl font-display font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-border/40 bg-secondary/10 p-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Revenue Over Time</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  tickFormatter={(val) => format(new Date(val), "MMM dd")}
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(val) => formatPrice(Number(val))}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0 }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value) => formatPrice(Number(value))}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border/40 bg-secondary/10 p-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Orders by Status</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {stats.ordersByStatus && stats.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-muted-foreground text-sm uppercase">No Order Data</span>
            )}
          </div>
        </div>
      </div>

      <div className="border border-border/40 bg-secondary/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-normal">Order ID</th>
                <th className="px-4 py-3 font-normal">Customer</th>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map(order => (
                <tr key={order.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-4 font-mono">#{order.id}</td>
                  <td className="px-4 py-4">{order.user?.name || order.guestName || `User ${order.userId}`}</td>
                  <td className="px-4 py-4 text-muted-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                  <td className="px-4 py-4 font-bold">{formatPrice(order.totalPrice)}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-secondary/50 border border-border/40">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
