import { getDb } from "../connection";
import { nextId } from "../counter";
import type { WishlistItem } from "../types";

const COL = "wishlistItems";

export async function listWishlistItems(userId: number): Promise<WishlistItem[]> {
  return getDb().collection<WishlistItem>(COL).find({ userId }).toArray();
}

export async function findWishlistItem(
  userId: number,
  productId: number,
): Promise<WishlistItem | null> {
  return getDb().collection<WishlistItem>(COL).findOne({ userId, productId });
}

export async function createWishlistItem(
  userId: number,
  productId: number,
): Promise<WishlistItem> {
  const item: WishlistItem = {
    id: await nextId(COL),
    userId,
    productId,
    createdAt: new Date(),
  };
  await getDb().collection<WishlistItem>(COL).insertOne(item);
  return item;
}

export async function deleteWishlistItem(userId: number, productId: number): Promise<void> {
  await getDb().collection<WishlistItem>(COL).deleteOne({ userId, productId });
}
