"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
  vendorId: string;
  image?: string;
  deliveryType?: 'RUNNER' | 'SELF_COLLECT';
  selected?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updateDeliveryType: (productId: string, deliveryType: 'RUNNER' | 'SELF_COLLECT') => void;
  toggleSelect: (productId: string) => void;
  toggleSelectAll: () => void;
  removeSelected: () => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  selectedTotal: number;
  selectedCount: number;
  allSelected: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('pulse_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Cart hydration failed:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pulse_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => i.productId === item.productId
          ? { ...i, qty: i.qty + item.qty }
          : i
        );
      }
      return [...prev, { ...item, selected: true }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const updateDeliveryType = (productId: string, deliveryType: 'RUNNER' | 'SELF_COLLECT') => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, deliveryType } : i));
  };

  const toggleSelect = (productId: string) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, selected: !i.selected } : i));
  };

  const toggleSelectAll = () => {
    setCart(prev => {
      const allSelected = prev.every(i => i.selected);
      return prev.map(i => ({ ...i, selected: !allSelected }));
    });
  };

  const removeSelected = () => {
    setCart(prev => prev.filter(i => !i.selected));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const selectedTotal = cart.filter(i => i.selected).reduce((acc, item) => acc + (item.price * item.qty), 0);
  const selectedCount = cart.filter(i => i.selected).reduce((acc, item) => acc + item.qty, 0);
  const allSelected = cart.length > 0 && cart.every(i => i.selected);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      updateDeliveryType,
      toggleSelect,
      toggleSelectAll,
      removeSelected,
      clearCart,
      cartTotal,
      cartCount,
      selectedTotal,
      selectedCount,
      allSelected
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
