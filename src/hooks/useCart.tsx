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

type CartState = Record<string, Cart>; // Keyed by vendorId

type CartContextValue = {
  carts: CartState;
  addItem: (
    vendor: { id: string; name: string; slug: string; currency: string; deliveryFee: number; minOrder: number },
    item: { menuItemId: string; name: string; price: number; imageUrl?: string | null },
  ) => void;
  removeItem: (vendorId: string, menuItemId: string) => void;
  setQuantity: (vendorId: string, menuItemId: string, quantity: number) => void;
  clearVendorCart: (vendorId: string) => void;
  clearAllCarts: () => void;
  itemCount: number; // Total across all carts (for the top nav badge)
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "naijaeats_cart_v2";

function readCarts(): CartState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartState) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [carts, setCarts] = useState<CartState>({});

  // Hydrate from localStorage only after mount, to avoid SSR/client mismatch.
  useEffect(() => {
    setCarts(readCarts());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (Object.keys(carts).length > 0) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [carts]);

  const addItem: CartContextValue["addItem"] = (vendor, item) => {
    setCarts((prev) => {
      const vendorCart = prev[vendor.id] || {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorSlug: vendor.slug,
        currency: vendor.currency,
        deliveryFee: vendor.deliveryFee,
        minOrder: vendor.minOrder,
        items: [],
      };

      const existingIdx = vendorCart.items.findIndex((i) => i.menuItemId === item.menuItemId);
      const newItems =
        existingIdx >= 0
          ? vendorCart.items.map((i, idx) => (idx === existingIdx ? { ...i, quantity: i.quantity + 1 } : i))
          : [...vendorCart.items, { ...item, quantity: 1 }];

      return {
        ...prev,
        [vendor.id]: { ...vendorCart, items: newItems },
      };
    });
  };

  const removeItem = (vendorId: string, menuItemId: string) => {
    setCarts((prev) => {
      const vendorCart = prev[vendorId];
      if (!vendorCart) return prev;
      const items = vendorCart.items.filter((i) => i.menuItemId !== menuItemId);
      
      const next = { ...prev };
      if (items.length === 0) {
        delete next[vendorId];
      } else {
        next[vendorId] = { ...vendorCart, items };
      }
      return next;
    });
  };

  const setQuantity = (vendorId: string, menuItemId: string, quantity: number) => {
    if (quantity < 1) return removeItem(vendorId, menuItemId);
    setCarts((prev) => {
      const vendorCart = prev[vendorId];
      if (!vendorCart) return prev;
      const items = vendorCart.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i));
      return {
        ...prev,
        [vendorId]: { ...vendorCart, items },
      };
    });
  };

  const clearVendorCart = (vendorId: string) => {
    setCarts((prev) => {
      const next = { ...prev };
      delete next[vendorId];
      return next;
    });
  };

  const clearAllCarts = () => setCarts({});

  const itemCount = useMemo(() => {
    let count = 0;
    for (const cart of Object.values(carts)) {
      count += cart.items.reduce((s, i) => s + i.quantity, 0);
    }
    return count;
  }, [carts]);

  return (
    <CartContext.Provider
      value={{ carts, addItem, removeItem, setQuantity, clearVendorCart, clearAllCarts, itemCount }}
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
