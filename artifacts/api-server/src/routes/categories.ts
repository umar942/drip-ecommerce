import { Router } from "express";
import { categoriesRepo } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { CreateCategoryBody } from "@workspace/api-zod";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await categoriesRepo.listCategories();
  res.json(categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
  })));
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const cat = await categoriesRepo.createCategory(parsed.data);
  res.status(201).json({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
  });
});

router.delete("/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await categoriesRepo.deleteCategory(id);
  res.sendStatus(204);
});

export default router;
