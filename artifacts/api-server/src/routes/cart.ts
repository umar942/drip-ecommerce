import { Router } from "express";
import { cartRepo, productsRepo, type Product } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { AddToCartBody, UpdateCartItemBody } from "@workspace/api-zod";

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

async function buildCart(userId: number) {
  const items = await cartRepo.listCartItems(userId);

  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await productsRepo.findProductById(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        product: product ? formatProduct(product) : null,
      };
    }),
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
  await cartRepo.clearCart(userId);
  res.json({ message: "Cart cleared" });
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { productId, quantity, size, color } = parsed.data;

  const existing = await cartRepo.findCartItem(userId, productId);

  if (existing) {
    await cartRepo.updateCartItemQuantity(existing.id, existing.quantity + quantity);
  } else {
    await cartRepo.createCartItem({
      userId,
      productId,
      quantity,
      size: size ?? null,
      color: color ?? null,
    });
  }

  res.status(201).json(await buildCart(userId));
});

router.patch("/cart/items/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await cartRepo.updateCartItemQuantity(id, parsed.data.quantity);

  res.json(await buildCart(userId));
});

router.delete("/cart/items/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthRequest).user.id;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  await cartRepo.deleteCartItem(id, userId);

  res.json(await buildCart(userId));
});

export default router;
