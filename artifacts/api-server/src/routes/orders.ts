import { Router } from "express";
import {
  ordersRepo,
  productsRepo,
  usersRepo,
  addressesRepo,
  cartRepo,
  type Order,
  type Product,
} from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/auth";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";

const router = Router();

function formatProduct(p: Product) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    category: p.category,
    categoryId: p.categoryId,
    images: p.images,
    modelUrl: p.modelUrl,
    stock: p.stock,
    sizes: p.sizes,
    colors: p.colors,
    tags: p.tags,
    featured: p.featured,
    createdAt: p.createdAt,
  };
}

async function buildOrder(order: Order) {
  const items = await ordersRepo.listOrderItems(order.id);
  const itemsWithProducts = await Promise.all(items.map(async (item) => {
    const product = await productsRepo.findProductById(item.productId);
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
      product: product ? formatProduct(product) : null,
    };
  }));

  const user = await usersRepo.findUserById(order.userId);
  const address = order.addressId ? await addressesRepo.findAddressById(order.addressId) : null;

  return {
    id: order.id,
    userId: order.userId,
    items: itemsWithProducts,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentStatus: order.paymentStatus,
    address: address ? {
      id: address.id,
      userId: address.userId,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      zip: address.zip,
      isDefault: address.isDefault,
    } : null,
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  const isAdmin = authReq.user.role === "admin" || authReq.user.role === "staff";
  const orders = await ordersRepo.listOrders(isAdmin ? undefined : authReq.user.id);
  const built = await Promise.all(orders.map(buildOrder));
  res.json(built);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const cartItems = await cartRepo.listCartItems(userId);
  if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

  let total = 0;
  const orderItemData: Array<{
    productId: number;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
  }> = [];

  for (const item of cartItems) {
    const product = await productsRepo.findProductById(item.productId);
    if (!product) continue;
    const price = product.price;
    total += price * item.quantity;
    orderItemData.push({
      productId: item.productId,
      quantity: item.quantity,
      price,
      size: item.size,
      color: item.color,
    });
  }

  const order = await ordersRepo.createOrder(
    {
      userId,
      totalPrice: Math.round(total * 100) / 100,
      addressId: parsed.data.addressId ?? null,
      paymentMethod: parsed.data.paymentMethod ?? "card",
      paymentStatus: "paid",
      status: "pending",
    },
    orderItemData,
  );
  await cartRepo.clearCart(userId);

  res.status(201).json(await buildOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const order = await ordersRepo.findOrderById(id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildOrder(order));
});

router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: { status?: typeof parsed.data.status; paymentStatus?: typeof parsed.data.paymentStatus } = {
    status: parsed.data.status,
  };
  if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;

  const order = await ordersRepo.updateOrder(id, updates);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildOrder(order));
});

export default router;
