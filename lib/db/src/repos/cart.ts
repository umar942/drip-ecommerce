import { getDb } from "../connection";
import { nextId } from "../counter";
import type { CartItem } from "../types";

const COL = "cartItems";

export async function listCartItems(userId: number): Promise<CartItem[]> {
  return getDb().collection<CartItem>(COL).find({ userId }).toArray();
}

export async function findCartItem(userId: number, productId: number): Promise<CartItem | null> {
  return getDb().collection<CartItem>(COL).findOne({ userId, productId });
}

export async function findCartItemById(id: number): Promise<CartItem | null> {
  return getDb().collection<CartItem>(COL).findOne({ id });
}

export async function createCartItem(
  data: Omit<CartItem, "id" | "createdAt" | "updatedAt">,
): Promise<CartItem> {
  const now = new Date();
  const item: CartItem = {
    id: await nextId(COL),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection<CartItem>(COL).insertOne(item);
  return item;
}

export async function updateCartItemQuantity(id: number, quantity: number): Promise<void> {
  await getDb().collection<CartItem>(COL).updateOne(
    { id },
    { $set: { quantity, updatedAt: new Date() } },
  );
}

export async function deleteCartItem(id: number, userId: number): Promise<void> {
  await getDb().collection<CartItem>(COL).deleteOne({ id, userId });
}

export async function clearCart(userId: number): Promise<void> {
  await getDb().collection<CartItem>(COL).deleteMany({ userId });
}
