import { Router } from "express";
import { productsRepo, type Product } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

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

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await productsRepo.listFeaturedProducts(8);
  if (products.length < 4) {
    const all = await productsRepo.listRecentProducts(8);
    res.json(all.map(formatProduct));
    return;
  }
  res.json(products.map(formatProduct));
});

router.get("/products", async (req, res): Promise<void> => {
  const { category, search, minPrice, maxPrice, size, color, page = "1", limit = "20" } =
    req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const { products, total } = await productsRepo.listProducts(
    {
      category: category || undefined,
      search: search || undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      size: size || undefined,
      color: color || undefined,
    },
    limitNum,
    offset,
  );

  res.json({
    products: products.map(formatProduct),
    total,
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
  const product = await productsRepo.createProduct(parsed.data);
  res.status(201).json(formatProduct(product));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const product = await productsRepo.findProductById(id);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(product));
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const product = await productsRepo.updateProduct(id, parsed.data);
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatProduct(product));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await productsRepo.deleteProduct(id);
  res.sendStatus(204);
});

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const product = await productsRepo.findProductById(id);
  if (!product) { res.json([]); return; }
  const related = await productsRepo.listRelatedProducts(product.category, id, 4);
  res.json(related.map(formatProduct));
});

export default router;
