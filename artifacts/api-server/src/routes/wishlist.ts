import { Router } from "express";
import { wishlistRepo, productsRepo, type Product } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { AddToWishlistBody } from "@workspace/api-zod";

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

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const items = await wishlistRepo.listWishlistItems(userId);

  const withProducts = await Promise.all(items.map(async (item) => {
    const product = await productsRepo.findProductById(item.productId);
    return {
      id: item.id,
      productId: item.productId,
      product: product ? formatProduct(product) : null,
      createdAt: item.createdAt,
    };
  }));

  res.json(withProducts);
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { productId } = parsed.data;
  const existing = await wishlistRepo.findWishlistItem(userId, productId);

  if (existing) {
    res.status(201).json({ id: existing.id, productId: existing.productId, createdAt: existing.createdAt });
    return;
  }

  const item = await wishlistRepo.createWishlistItem(userId, productId);
  const product = await productsRepo.findProductById(productId);
  res.status(201).json({
    id: item.id,
    productId: item.productId,
    product: product ? formatProduct(product) : null,
    createdAt: item.createdAt,
  });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const productId = parseInt(raw, 10);
  await wishlistRepo.deleteWishlistItem(userId, productId);
  res.sendStatus(204);
});

export default router;
