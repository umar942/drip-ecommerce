import { Router } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable, addressesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";

const router = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id, title: p.title, description: p.description ?? null,
    price: parseFloat(p.price), compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
    category: p.category, categoryId: p.categoryId ?? null, images: p.images ?? [],
    modelUrl: p.modelUrl ?? null, stock: p.stock, sizes: p.sizes ?? [],
    colors: p.colors ?? [], tags: p.tags ?? [], featured: p.featured, createdAt: p.createdAt,
  };
}

async function buildOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const itemsWithProducts = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    return {
      id: item.id, productId: item.productId, quantity: item.quantity,
      price: parseFloat(item.price), size: item.size ?? null, color: item.color ?? null,
      product: product ? formatProduct(product) : null,
    };
  }));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
  const [address] = order.addressId ? await db.select().from(addressesTable).where(eq(addressesTable.id, order.addressId)) : [null];

  return {
    id: order.id, userId: order.userId, items: itemsWithProducts,
    totalPrice: parseFloat(order.totalPrice),
    status: order.status, paymentStatus: order.paymentStatus,
    address: address ? {
      id: address.id, userId: address.userId, label: address.label ?? null,
      line1: address.line1, line2: address.line2 ?? null,
      city: address.city, state: address.state, country: address.country,
      zip: address.zip, isDefault: address.isDefault,
    } : null,
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } : null,
    createdAt: order.createdAt, updatedAt: order.updatedAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  const isAdmin = authReq.user.role === "admin" || authReq.user.role === "staff";
  const where = isAdmin ? undefined : eq(ordersTable.userId, authReq.user.id);
  const orders = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt));
  const built = await Promise.all(orders.map(buildOrder));
  res.json(built);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  let total = 0;
  const orderItemData: Array<{ productId: number; quantity: number; price: string; size: string | null; color: string | null }> = [];

  for (const item of cartItems) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) continue;
    const price = parseFloat(product.price);
    total += price * item.quantity;
    orderItemData.push({ productId: item.productId, quantity: item.quantity, price: String(price), size: item.size, color: item.color });
  }

  const [order] = await db.insert(ordersTable).values({
    userId, totalPrice: String(Math.round(total * 100) / 100),
    addressId: parsed.data.addressId, paymentMethod: parsed.data.paymentMethod ?? "card",
    paymentStatus: "paid",
  }).returning();

  await db.insert(orderItemsTable).values(orderItemData.map(d => ({ ...d, orderId: order.id })));
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  res.status(201).json(await buildOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildOrder(order));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Partial<typeof ordersTable.$inferInsert> = { status: parsed.data.status };
  if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;

  const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildOrder(order));
});

export default router;
