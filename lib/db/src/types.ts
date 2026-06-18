import { z } from "zod/v4";

export type UserRole = "user" | "admin" | "staff";
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  category: string;
  categoryId: number | null;
  images: string[];
  modelUrl: string | null;
  stock: number;
  sizes: string[];
  colors: string[];
  tags: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: number;
  userId: number;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  zip: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  size: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  addressId: number | null;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(["user", "admin", "staff"]).optional(),
  emailVerified: z.boolean().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertProductSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  compareAtPrice: z.number().nullable().optional(),
  category: z.string(),
  categoryId: z.number().nullable().optional(),
  images: z.array(z.string()).optional(),
  modelUrl: z.string().nullable().optional(),
  stock: z.number().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const insertAddressSchema = z.object({
  userId: z.number(),
  label: z.string().nullable().optional(),
  line1: z.string(),
  line2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zip: z.string(),
  isDefault: z.boolean().optional(),
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;
