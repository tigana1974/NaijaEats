import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export type Cart = {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  currency: string;
  deliveryFee: number;
  minOrder: number;
  items: CartItem[];
};

type CartContextValue = {
  cart: Cart | null;
  addItem: (
    vendor: { id: string; name: string; slug: string; currency: string; deliveryFee: number; minOrder: number },
    item: { menuItemId: string; name: string; price: number; imageUrl?: string | null },
  ) => "added" | "different_vendor";
  confirmSwitchVendor: (
    vendor: { id: string; name: string; slug: string; currency: string; deliveryFee: number; minOrder: number },
    item: { menuItemId: string; name: string; price: number; imageUrl?: string | null },
  ) => void;
  removeItem: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "naijaeats_cart_v1";

function readCart(): Cart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  // Hydrate from localStorage only after mount, to avoid SSR/client mismatch.
  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cart) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [cart]);

  const addItem: CartContextValue["addItem"] = (vendor, item) => {
    if (cart && cart.vendorId !== vendor.id) return "different_vendor";
    setCart((prev) => {
      const base: Cart =
        prev && prev.vendorId === vendor.id
          ? prev
          : {
              vendorId: vendor.id,
              vendorName: vendor.name,
              vendorSlug: vendor.slug,
              currency: vendor.currency,
              deliveryFee: vendor.deliveryFee,
              minOrder: vendor.minOrder,
              items: [],
            };
      const existingIdx = base.items.findIndex((i) => i.menuItemId === item.menuItemId);
      const items =
        existingIdx >= 0
          ? base.items.map((i, idx) => (idx === existingIdx ? { ...i, quantity: i.quantity + 1 } : i))
          : [...base.items, { ...item, quantity: 1 }];
      return { ...base, items };
    });
    return "added";
  };

  const confirmSwitchVendor: CartContextValue["confirmSwitchVendor"] = (vendor, item) => {
    setCart({
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      currency: vendor.currency,
      deliveryFee: vendor.deliveryFee,
      minOrder: vendor.minOrder,
      items: [{ ...item, quantity: 1 }],
    });
  };

  const removeItem = (menuItemId: string) => {
    setCart((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.menuItemId !== menuItemId);
      return items.length ? { ...prev, items } : null;
    });
  };

  const setQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 1) return removeItem(menuItemId);
    setCart((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)) };
    });
  };

  const clearCart = () => setCart(null);

  const { itemCount, subtotal } = useMemo(() => {
    if (!cart) return { itemCount: 0, subtotal: 0 };
    return {
      itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
      subtotal: cart.items.reduce((s, i) => s + i.price * i.quantity, 0),
    };
  }, [cart]);

  return (
    <CartContext.Provider
      value={{ cart, addItem, confirmSwitchVendor, removeItem, setQuantity, clearCart, itemCount, subtotal }}
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
