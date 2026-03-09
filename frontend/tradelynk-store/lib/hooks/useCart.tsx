"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface CartItem {
  itemId: number;
  title: string;
  imageUrl: string | null;
  sellerName: string;
  /** Price in KOBO (base item price) */
  price: number;
  /** Effective price in KOBO — variant price if variant selected, else base price */
  effectivePrice: number;
  variantId?: number;
  variantName?: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number, variantId?: number) => void;
  clearCart: () => void;
  isInCart: (itemId: number, variantId?: number) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "tradelynk_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some(
        (i) => i.itemId === item.itemId && i.variantId === item.variantId,
      );
      if (exists) return prev;
      return [...prev, item];
    });
    setIsOpen(true); // auto-open drawer on add
  }, []);

  const removeItem = useCallback((itemId: number, variantId?: number) => {
    setItems((prev) =>
      prev.filter((i) => !(i.itemId === itemId && i.variantId === variantId)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const isInCart = useCallback(
    (itemId: number, variantId?: number) =>
      items.some((i) => i.itemId === itemId && i.variantId === variantId),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
