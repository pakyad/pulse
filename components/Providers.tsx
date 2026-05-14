"use client";

import { CartProvider } from "@/lib/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
