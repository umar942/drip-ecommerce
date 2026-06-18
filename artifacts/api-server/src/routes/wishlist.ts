import { Router } from "express";
import { db, wishlistItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { AddToWishlistBody } from "@workspace/api-zod";

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

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, userId));

  const withProducts = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    return { id: item.id, productId: item.productId, product: product ? formatProduct(product) : null, createdAt: item.createdAt };
  }));

  res.json(withProducts);
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { productId } = parsed.data;
  const [existing] = await db.select().from(wishlistItemsTable)
    .where(and(eq(wishlistItemsTable.userId, userId), eq(wishlistItemsTable.productId, productId)));

  if (existing) { res.status(201).json({ id: existing.id, productId: existing.productId, createdAt: existing.createdAt }); return; }

  const [item] = await db.insert(wishlistItemsTable).values({ userId, productId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  res.status(201).json({ id: item.id, productId: item.productId, product: product ? formatProduct(product) : null, createdAt: item.createdAt });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  await db.delete(wishlistItemsTable).where(and(eq(wishlistItemsTable.userId, userId), eq(wishlistItemsTable.productId, productId)));
  res.sendStatus(204);
});

export default router;
