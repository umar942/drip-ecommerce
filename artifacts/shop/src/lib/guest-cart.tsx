import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Product } from "@workspace/api-client-react";

export interface GuestCartItem {
  id: string;
  productId: number;
  quantity: number;
  size: string | null;
  color: string | null;
  product: Product;
}

interface GuestCartContextType {
  items: GuestCartItem[];
  add: (input: { productId: number; quantity: number; size?: string | null; color?: string | null; product: Product }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "drip_guest_cart";

const GuestCartContext = createContext<GuestCartContextType | undefined>(undefined);

function loadFromStorage(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>(() => loadFromStorage());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: GuestCartContextType["add"] = ({ productId, quantity, size, color, product }) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === productId && i.size === (size ?? null) && i.color === (color ?? null),
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      const newItem: GuestCartItem = {
        id: `${productId}-${size ?? "_"}-${color ?? "_"}-${Date.now()}`,
        productId,
        quantity,
        size: size ?? null,
        color: color ?? null,
        product,
      };
      return [...prev, newItem];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clear = () => setItems([]);

  return (
    <GuestCartContext.Provider value={{ items, add, updateQuantity, remove, clear }}>
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (context === undefined) {
    throw new Error("useGuestCart must be used within a GuestCartProvider");
  }
  return context;
}
