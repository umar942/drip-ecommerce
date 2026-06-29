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
import { requireAuth, requireAdmin, optionalAuth, type AuthRequest, type OptionalAuthRequest } from "../lib/auth";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { isPakistanCountry, validatePakistanAddress } from "../lib/pakistan";

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

  const user = order.userId != null ? await usersRepo.findUserById(order.userId) : null;
  const address = order.addressId ? await addressesRepo.findAddressById(order.addressId) : null;

  const addressOut = address
    ? {
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
      }
    : order.guestAddress
      ? {
          id: null,
          userId: null,
          label: null,
          line1: order.guestAddress.line1,
          line2: order.guestAddress.line2,
          city: order.guestAddress.city,
          state: order.guestAddress.state,
          country: order.guestAddress.country,
          zip: order.guestAddress.zip,
          isDefault: false,
        }
      : null;

  return {
    id: order.id,
    userId: order.userId,
    items: itemsWithProducts,
    totalPrice: order.totalPrice,
    status: order.status,
    paymentStatus: order.paymentStatus,
    address: addressOut,
    guestName: order.guestName,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
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

router.post("/orders", optionalAuth, async (req, res): Promise<void> => {
  const user = (req as OptionalAuthRequest).user;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const method = parsed.data.paymentMethod ?? "cod";
  const availableMethods = new Set(["cod"]);
  if (!availableMethods.has(method)) {
    res.status(400).json({ error: "This payment method is not available yet" });
    return;
  }

  let orderItemData: Array<{
    productId: number;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
  }> = [];
  let total = 0;

  if (user) {
    const cartItems = await cartRepo.listCartItems(user.id);
    if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

    if (!parsed.data.addressId) {
      res.status(400).json({ error: "A Pakistan delivery address is required" });
      return;
    }
    const address = await addressesRepo.findAddressById(parsed.data.addressId);
    if (!address || address.userId !== user.id) {
      res.status(400).json({ error: "Invalid delivery address" });
      return;
    }
    if (!isPakistanCountry(address.country)) {
      res.status(400).json({ error: "This store only ships within Pakistan" });
      return;
    }

    for (const item of cartItems) {
      const product = await productsRepo.findProductById(item.productId);
      if (!product) continue;
      total += product.price * item.quantity;
      orderItemData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        color: item.color,
      });
    }

    const order = await ordersRepo.createOrder(
      {
        userId: user.id,
        totalPrice: Math.round(total * 100) / 100,
        addressId: parsed.data.addressId,
        paymentMethod: method,
        paymentStatus: method === "cod" ? "pending" : "paid",
        status: "pending",
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        guestAddress: null,
      },
      orderItemData,
    );
    await cartRepo.clearCart(user.id);

    res.status(201).json(await buildOrder(order));
    return;
  }

  // Guest checkout: cart lives client-side, so items are sent in the request.
  const { guestName, guestEmail, guestPhone, guestAddress, items } = parsed.data;
  if (!guestName?.trim() || !guestEmail?.trim() || !guestPhone?.trim()) {
    res.status(400).json({ error: "Name, email, and phone are required" });
    return;
  }
  if (!guestAddress) {
    res.status(400).json({ error: "A Pakistan delivery address is required" });
    return;
  }
  const addressError = validatePakistanAddress(guestAddress);
  if (addressError) { res.status(400).json({ error: addressError }); return; }
  if (!items || items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  for (const item of items) {
    const product = await productsRepo.findProductById(item.productId);
    if (!product) continue;
    total += product.price * item.quantity;
    orderItemData.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      size: item.size ?? null,
      color: item.color ?? null,
    });
  }
  if (orderItemData.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const order = await ordersRepo.createOrder(
    {
      userId: null,
      totalPrice: Math.round(total * 100) / 100,
      addressId: null,
      paymentMethod: method,
      paymentStatus: method === "cod" ? "pending" : "paid",
      status: "pending",
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      guestAddress: {
        line1: guestAddress.line1,
        line2: guestAddress.line2 ?? null,
        city: guestAddress.city,
        state: guestAddress.state,
        country: guestAddress.country,
        zip: guestAddress.zip,
      },
    },
    orderItemData,
  );

  res.status(201).json(await buildOrder(order));
});

router.get("/orders/:id", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const order = await ordersRepo.findOrderById(id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }

  const user = (req as OptionalAuthRequest).user;

  if (order.userId != null) {
    const isOwner = !!user && user.id === order.userId;
    const isAdmin = !!user && (user.role === "admin" || user.role === "staff");
    if (!isOwner && !isAdmin) { res.status(401).json({ error: "Unauthorized" }); return; }
  } else {
    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (!email || email !== (order.guestEmail ?? "").toLowerCase()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

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
