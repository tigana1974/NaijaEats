import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VendorStore {
  activeShopId: string | null;
  setActiveShopId: (id: string | null) => void;
}

export const useVendorStore = create<VendorStore>()(
  persist(
    (set) => ({
      activeShopId: null,
      setActiveShopId: (id) => set({ activeShopId: id }),
    }),
    {
      name: "vendor-store",
    }
  )
);
