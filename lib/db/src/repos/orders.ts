import { getDb } from "../connection";
import { nextId } from "../counter";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "../types";

const ORDERS = "orders";
const ITEMS = "orderItems";

export async function listOrders(userId?: number): Promise<Order[]> {
  const filter = userId != null ? { userId } : {};
  return getDb().collection<Order>(ORDERS).find(filter).sort({ createdAt: -1 }).toArray();
}

export async function listRecentOrders(limit: number): Promise<Order[]> {
  return getDb().collection<Order>(ORDERS).find().sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function findOrderById(id: number): Promise<Order | null> {
  return getDb().collection<Order>(ORDERS).findOne({ id });
}

export async function listOrderItems(orderId: number): Promise<OrderItem[]> {
  return getDb().collection<OrderItem>(ITEMS).find({ orderId }).toArray();
}

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "updatedAt">,
  items: Array<Omit<OrderItem, "id" | "orderId">>,
): Promise<Order> {
  const now = new Date();
  const orderId = await nextId(ORDERS);
  const order: Order = {
    id: orderId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const orderItems: OrderItem[] = [];
  for (const item of items) {
    orderItems.push({
      id: await nextId(ITEMS),
      orderId,
      ...item,
    });
  }

  await getDb().collection<Order>(ORDERS).insertOne(order);
  if (orderItems.length > 0) {
    await getDb().collection<OrderItem>(ITEMS).insertMany(orderItems);
  }
  return order;
}

export async function updateOrder(
  id: number,
  updates: Partial<Pick<Order, "status" | "paymentStatus">>,
): Promise<Order | null> {
  const result = await getDb().collection<Order>(ORDERS).findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function countOrders(): Promise<number> {
  return getDb().collection<Order>(ORDERS).countDocuments();
}

export async function sumOrderRevenue(): Promise<number> {
  const result = await getDb()
    .collection<Order>(ORDERS)
    .aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }])
    .toArray();
  return result[0]?.total ?? 0;
}

export async function revenueByDay(days = 30): Promise<
  Array<{ date: string; revenue: number; orders: number }>
> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await getDb()
    .collection<Order>(ORDERS)
    .aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((r) => ({
    date: r._id,
    revenue: r.revenue,
    orders: r.orders,
  }));
}

export async function ordersByStatus(): Promise<Array<{ status: OrderStatus; count: number }>> {
  const rows = await getDb()
    .collection<Order>(ORDERS)
    .aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();

  return rows.map((r) => ({ status: r._id, count: r.count }));
}

export type { OrderStatus, PaymentStatus };
