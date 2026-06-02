"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ShoppingBag, Trash2, Plus, Minus, 
  ArrowRight, ShieldCheck, ShoppingCart
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';


export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQty, cartTotal, cartCount } = useCart();

  const handleCheckout = () => {
    // For now, we'll redirect to a generic multi-item checkout
    // or the first item's checkout for demo purposes.
    // In a real app, we'd have a /cart/checkout route.
    router.push('/cart/checkout');
  };

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">
      
      {/* ── NAV (Optical Institutionalism) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-4">
          <BackButton fallback="/marketplace" />
          <div>
            <p className="text-[15px] font-bold tracking-tight text-[#000000] leading-tight">Shopping Bag</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{cartCount} items selected</p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">
        
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-56 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 flex items-center justify-center text-slate-200 mb-6">
                <ShoppingCart size={48} strokeWidth={2} />
              </div>
              <h2 className="text-[17px] font-bold tracking-tight text-[#000000] mb-2">Your bag is empty</h2>
              <p className="text-[13px] font-medium text-slate-400 max-w-[200px] leading-relaxed">
                Nothing here yet. Browse the marketplace?
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by Vendor logic could go here, but for simplicity we list all */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-100">
                           <ShoppingCart size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">
                      <div>
                        <p className="text-[14px] font-bold text-[#000000] truncate">{item.title}</p>
                        <p className="text-[12px] font-bold text-[#94a3b8]">RM {item.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         {/* Stepper */}
                         <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-2 py-1">
                            <button 
                              onClick={() => updateQty(item.productId, item.qty - 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#94a3b8] hover:text-[#000000] active:scale-95 transition-transform"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-[13px] font-bold w-4 text-center">{item.qty}</span>
                            <button 
                              onClick={() => updateQty(item.productId, item.qty + 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#94a3b8] hover:text-[#000000] active:scale-95 transition-transform"
                            >
                              <Plus size={14} />
                            </button>
                         </div>
                         
                         <button 
                          onClick={() => removeFromCart(item.productId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <section className="space-y-4 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px] font-medium text-[#94a3b8]">
                    <span>Subtotal</span>
                    <span className="text-[#000000] font-bold">RM {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] font-medium text-[#94a3b8]">
                    <span>Service Fee</span>
                    <span className="text-emerald-500 font-bold">Free</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[15px] font-bold text-[#000000]">Order Total</span>
                    <span className="text-[20px] font-black text-[#000000]">RM {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                  <ShieldCheck size={16} className="text-[#000000] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
                    Transactions are held in escrow until you confirm receipt. Real-time GPS verification ensures secure campus delivery.
                  </p>
                </div>
              </section>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STICKY FOOTER ── */}
      {cart.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
          <button
            onClick={handleCheckout}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-slate-900/10"
          >
            Checkout All <ArrowRight size={18} />
          </button>
        </footer>
      )}

      
    </main>
  );
}
