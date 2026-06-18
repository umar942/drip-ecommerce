import { Router } from "express";
import { db, ordersTable, productsTable, usersTable, orderItemsTable } from "@workspace/db";
import { desc, sql, eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { productsTable as pt } from "@workspace/db";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [{ totalOrders }] = await db.select({ totalOrders: sql<number>`count(*)` }).from(ordersTable);
  const [{ totalProducts }] = await db.select({ totalProducts: sql<number>`count(*)` }).from(productsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable);
  const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(cast(total_price as numeric)), 0)` }).from(ordersTable);

  const revenueRows = await db.execute(sql`
    SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
           sum(cast(total_price as numeric)) as revenue,
           count(*) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY 1
    ORDER BY 1
  `);

  const statusRows = await db.execute(sql`
    SELECT status, count(*) as count FROM orders GROUP BY status
  `);

  res.json({
    totalRevenue: Number(totalRevenue) || 0,
    totalOrders: Number(totalOrders) || 0,
    totalProducts: Number(totalProducts) || 0,
    totalUsers: Number(totalUsers) || 0,
    revenueByDay: (revenueRows.rows as Array<{ date: string; revenue: string; orders: string }>).map(r => ({
      date: r.date,
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders, 10) || 0,
    })),
    ordersByStatus: (statusRows.rows as Array<{ status: string; count: string }>).map(r => ({
      status: r.status,
      count: parseInt(r.count, 10) || 0,
    })),
  });
});

router.get("/admin/recent-orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);

  const withDetails = await Promise.all(orders.map(async (order) => {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    return {
      id: order.id, userId: order.userId,
      items: items.map(i => ({ id: i.id, productId: i.productId, quantity: i.quantity, price: parseFloat(i.price), size: i.size ?? null, color: i.color ?? null, product: null })),
      totalPrice: parseFloat(order.totalPrice),
      status: order.status, paymentStatus: order.paymentStatus,
      address: null,
      user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } : null,
      createdAt: order.createdAt, updatedAt: order.updatedAt,
    };
  }));

  res.json(withDetails);
});

export default router;
