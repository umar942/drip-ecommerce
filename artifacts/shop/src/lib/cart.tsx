import { useEffect, useRef } from "react";
import {
  useGetCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  getGetCartQueryKey,
  type Product,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { useGuestCart } from "./guest-cart";

export interface NormalizedCartItem {
  id: number | string;
  productId: number;
  quantity: number;
  size: string | null;
  color: string | null;
  product: Product;
}

export interface AddItemInput {
  productId: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: Product;
}

export interface UseCartResult {
  items: NormalizedCartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  addItem: (input: AddItemInput) => Promise<void>;
  updateItem: (id: number | string, quantity: number) => void;
  removeItem: (id: number | string) => void;
  clear: () => void;
}

export function useCart(): UseCartResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const guestCart = useGuestCart();

  const { data: serverCart, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey(), enabled: !!user },
  });
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const mergedRef = useRef(false);
  useEffect(() => {
    if (user && !mergedRef.current && guestCart.items.length > 0) {
      mergedRef.current = true;
      Promise.all(
        guestCart.items.map((item) =>
          addToCart.mutateAsync({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              size: item.size ?? undefined,
              color: item.color ?? undefined,
            },
          }).catch(() => null),
        ),
      ).then(() => {
        guestCart.clear();
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      });
    }
    if (!user) {
      mergedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user) {
    const items: NormalizedCartItem[] = (serverCart?.items ?? [])
      .filter((i) => i.product)
      .map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        product: i.product as Product,
      }));

    return {
      items,
      total: serverCart?.total ?? 0,
      itemCount: serverCart?.itemCount ?? 0,
      isLoading,
      addItem: async ({ productId, quantity, size, color }) => {
        await addToCart.mutateAsync({ data: { productId, quantity, size: size ?? undefined, color: color ?? undefined } });
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      updateItem: (id, quantity) => {
        updateCartItem.mutate(
          { id: Number(id), data: { quantity } },
          { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) },
        );
      },
      removeItem: (id) => {
        removeCartItem.mutate(
          { id: Number(id) },
          { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }) },
        );
      },
      clear: () => {
        clearCart.mutate(undefined, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
        });
      },
    };
  }

  const items: NormalizedCartItem[] = guestCart.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    quantity: i.quantity,
    size: i.size,
    color: i.color,
    product: i.product,
  }));
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    total: Math.round(total * 100) / 100,
    itemCount,
    isLoading: false,
    addItem: async ({ productId, quantity, size, color, product }) => {
      guestCart.add({ productId, quantity, size, color, product });
    },
    updateItem: (id, quantity) => guestCart.updateQuantity(String(id), quantity),
    removeItem: (id) => guestCart.remove(String(id)),
    clear: () => guestCart.clear(),
  };
}
