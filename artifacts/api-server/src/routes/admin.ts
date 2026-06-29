import { Router } from "express";
import { ordersRepo, productsRepo, usersRepo } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [totalOrders, totalProducts, totalUsers, totalRevenue, revenueByDay, ordersByStatus] =
    await Promise.all([
      ordersRepo.countOrders(),
      productsRepo.countProducts(),
      usersRepo.countUsers(),
      ordersRepo.sumOrderRevenue(),
      ordersRepo.revenueByDay(30),
      ordersRepo.ordersByStatus(),
    ]);

  res.json({
    totalRevenue: totalRevenue || 0,
    totalOrders: totalOrders || 0,
    totalProducts: totalProducts || 0,
    totalUsers: totalUsers || 0,
    revenueByDay,
    ordersByStatus: ordersByStatus.map((r) => ({
      status: r.status,
      count: r.count,
    })),
  });
});

router.get("/admin/recent-orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await ordersRepo.listRecentOrders(10);

  const withDetails = await Promise.all(orders.map(async (order) => {
    const items = await ordersRepo.listOrderItems(order.id);
    const user = order.userId != null ? await usersRepo.findUserById(order.userId) : null;
    return {
      id: order.id,
      userId: order.userId,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
        product: null,
      })),
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      address: null,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      guestPhone: order.guestPhone,
      user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }));

  res.json(withDetails);
});

export default router;
