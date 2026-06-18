import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

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

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.featured, true)).limit(8);
  if (products.length < 4) {
    const all = await db.select().from(productsTable).orderBy(productsTable.createdAt).limit(8);
    res.json(all.map(formatProduct));
    return;
  }
  res.json(products.map(formatProduct));
});

router.get("/products", async (req, res): Promise<void> => {
  const { category, search, minPrice, maxPrice, size, color, page = "1", limit = "20" } = req.query as Record<string, string>;

  const conditions = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
  if (minPrice) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
  if (size) conditions.push(sql`${productsTable.sizes} @> ARRAY[${size}]::text[]`);
  if (color) conditions.push(sql`${productsTable.colors} @> ARRAY[${color}]::text[]`);

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).limit(limitNum).offset(offset).orderBy(productsTable.createdAt),
    db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
  ]);

  res.json({
    products: products.map(formatProduct),
    total: Number(countResult[0]?.count ?? 0),
    page: pageNum,
    limit: limitNum,
  });
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    compareAtPrice: parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
  }).returning();
  res.status(201).json(formatProduct(product));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(product));
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updates.price = String(parsed.data.price);
  if (parsed.data.compareAtPrice != null) updates.compareAtPrice = String(parsed.data.compareAtPrice);

  const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.json([]); return; }
  const related = await db.select().from(productsTable)
    .where(and(eq(productsTable.category, product.category), sql`${productsTable.id} != ${id}`))
    .limit(4);
  res.json(related.map(formatProduct));
});

export default router;
