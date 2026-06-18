import { Router } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { AddToCartBody, UpdateCartItemBody } from "@workspace/api-zod";

const router = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    price: parseFloat(p.price),
    compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
    category: p.category,
    categoryId: p.categoryId ?? null,
    images: p.images ?? [],
    modelUrl: p.modelUrl ?? null,
    stock: p.stock,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    tags: p.tags ?? [],
    featured: p.featured,
    createdAt: p.createdAt,
  };
}

async function buildCart(userId: number) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size ?? null,
        color: item.color ?? null,
        product: product ? formatProduct(product) : null,
      };
    })
  );

  const total = itemsWithProducts.reduce((sum, item) => {
    return sum + (item.product ? item.product.price * item.quantity : 0);
  }, 0);

  return {
    items: itemsWithProducts,
    total: Math.round(total * 100) / 100,
    itemCount: itemsWithProducts.reduce((sum, item) => sum + item.quantity, 0),
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  res.json(await buildCart(userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  res.json({ message: "Cart cleared" });
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { productId, quantity, size, color } = parsed.data;

  const [existing] = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));

  if (existing) {
    await db.update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity, size: size ?? null, color: color ?? null });
  }

  res.status(201).json(await buildCart(userId));
});

router.patch("/cart/items/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  await db.delete(cartItemsTable)
    .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));

  res.json(await buildCart(userId));
});

export default router;
