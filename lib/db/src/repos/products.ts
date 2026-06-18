import { getDb } from "../connection";
import { nextId } from "../counter";
import type { Product, InsertProduct } from "../types";

const COL = "products";

export interface ProductFilter {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
}

function buildFilter(filter: ProductFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filter.category) query.category = filter.category;
  if (filter.search) query.title = { $regex: filter.search, $options: "i" };
  if (filter.minPrice != null || filter.maxPrice != null) {
    query.price = {};
    if (filter.minPrice != null) (query.price as Record<string, number>).$gte = filter.minPrice;
    if (filter.maxPrice != null) (query.price as Record<string, number>).$lte = filter.maxPrice;
  }
  if (filter.size) query.sizes = filter.size;
  if (filter.color) query.colors = filter.color;
  return query;
}

export async function findProductById(id: number): Promise<Product | null> {
  return getDb().collection<Product>(COL).findOne({ id });
}

export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  return getDb().collection<Product>(COL).find({ featured: true }).limit(limit).toArray();
}

export async function listProducts(
  filter: ProductFilter,
  limit: number,
  offset: number,
): Promise<{ products: Product[]; total: number }> {
  const query = buildFilter(filter);
  const collection = getDb().collection<Product>(COL);
  const [products, total] = await Promise.all([
    collection.find(query).sort({ createdAt: 1 }).skip(offset).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);
  return { products, total };
}

export async function listRecentProducts(limit: number): Promise<Product[]> {
  return getDb().collection<Product>(COL).find().sort({ createdAt: 1 }).limit(limit).toArray();
}

export async function listRelatedProducts(
  category: string,
  excludeId: number,
  limit = 4,
): Promise<Product[]> {
  return getDb()
    .collection<Product>(COL)
    .find({ category, id: { $ne: excludeId } })
    .limit(limit)
    .toArray();
}

export async function countProducts(): Promise<number> {
  return getDb().collection<Product>(COL).countDocuments();
}

export async function createProduct(data: InsertProduct): Promise<Product> {
  const now = new Date();
  const product: Product = {
    id: await nextId(COL),
    title: data.title,
    description: data.description ?? null,
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    category: data.category,
    categoryId: data.categoryId ?? null,
    images: data.images ?? [],
    modelUrl: data.modelUrl ?? null,
    stock: data.stock ?? 0,
    sizes: data.sizes ?? [],
    colors: data.colors ?? [],
    tags: data.tags ?? [],
    featured: data.featured ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection<Product>(COL).insertOne(product);
  return product;
}

export async function updateProduct(
  id: number,
  updates: Partial<Omit<Product, "id" | "createdAt">>,
): Promise<Product | null> {
  const result = await getDb().collection<Product>(COL).findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function deleteProduct(id: number): Promise<void> {
  await getDb().collection<Product>(COL).deleteOne({ id });
}
