import { getDb } from "../connection";
import { nextId } from "../counter";
import type { Category, InsertCategory } from "../types";

const COL = "categories";

export async function listCategories(): Promise<Category[]> {
  return getDb().collection<Category>(COL).find().sort({ name: 1 }).toArray();
}

export async function createCategory(data: InsertCategory): Promise<Category> {
  const category: Category = {
    id: await nextId(COL),
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
    createdAt: new Date(),
  };
  await getDb().collection<Category>(COL).insertOne(category);
  return category;
}

export async function deleteCategory(id: number): Promise<void> {
  await getDb().collection<Category>(COL).deleteOne({ id });
}
