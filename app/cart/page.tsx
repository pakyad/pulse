"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Trash2, Plus, Minus, 
  ArrowRight, ShieldCheck, ShoppingCart, Truck, X
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

const RUNNER_FEE = 3.50;
const PLATFORM_FEE = 1.50;

export default function CartPage() {
  const router = useRouter();
  const {
    cart, removeFromCart, updateQty, updateDeliveryType,
    toggleSelect, toggleSelectAll, removeSelected,
    cartTotal, cartCount, selectedTotal, selectedCount, allSelected
  } = useCart();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedItems = cart.filter(i => i.selected);
  const runnerCount = selectedItems.filter(i => i.deliveryType === 'RUNNER').length;
  const runnerTotal = runnerCount * RUNNER_FEE;
  const orderTotal = selectedTotal + runnerTotal + PLATFORM_FEE;

  const handleDeleteSelected = () => {
    removeSelected();
    setShowDeleteConfirm(false);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    router.push('/cart/checkout');
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      
      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-4">
          <BackButton fallback="/marketplace" />
          <div>
            <p className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">Shopping Bag</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{cartCount} items</p>
          </div>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Delete ({selectedItems.length})
              </button>
            )}
          </div>
        )}
      </nav>

      {/*  DELETE CONFIRMATION OVERLAY  */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 flex items-end justify-center pb-24"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 mx-6 w-full max-w-sm shadow-xl"
            >
              <p className="text-[15px] font-bold text-slate-900 text-center">Remove {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}?</p>
              <p className="text-[12px] font-medium text-[#94a3b8] text-center mt-1 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[13px] font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-28 px-6 space-y-8">
        
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-56 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 flex items-center justify-center bg-slate-50 text-slate-300 rounded-3xl mb-6 shadow-sm border border-slate-100">
                <ShoppingBag size={32} strokeWidth={1.5} />
              </div>
              <h2 className="text-[17px] font-bold tracking-tight text-slate-900 mb-2">Your bag is empty</h2>
              <p className="text-[13px] font-medium text-slate-400 max-w-[200px] leading-relaxed mb-6">
                Nothing here yet.
              </p>
              <button
                onClick={() => router.push('/marketplace')}
                className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-[13px] tracking-tight active:scale-95 transition-transform shadow-md shadow-slate-900/10"
              >
                Browse Marketplace
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(item.productId)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.selected
                          ? 'bg-slate-900 border-slate-900'
                          : 'border-slate-300'
                      }`}
                    >
                      {item.selected && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </button>

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
                        <p className="text-[14px] font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[12px] font-bold text-[#94a3b8]">RM {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => updateDeliveryType(item.productId, 'SELF_COLLECT')}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              item.deliveryType === 'SELF_COLLECT'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-[#94a3b8] border-slate-200'
                            }`}
                          >
                            Self Collect
                          </button>
                          <button
                            onClick={() => updateDeliveryType(item.productId, 'RUNNER')}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                              item.deliveryType === 'RUNNER'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-[#94a3b8] border-slate-200'
                            }`}
                          >
                            <Truck size={10} />
                            Runner
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                         {/* Stepper */}
                         <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-2 py-1">
                            <button 
                              onClick={() => updateQty(item.productId, item.qty - 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 active:scale-95 transition-transform"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-[13px] font-bold w-4 text-center">{item.qty}</span>
                            <button 
                              onClick={() => updateQty(item.productId, item.qty + 1)}
                              className="w-6 h-6 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 active:scale-95 transition-transform"
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
              {selectedItems.length > 0 && (
                <section className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[13px] font-medium text-[#94a3b8]">
                      <span>Subtotal ({selectedCount} item{selectedCount > 1 ? 's' : ''})</span>
                      <span className="text-slate-900 font-bold">RM {selectedTotal.toFixed(2)}</span>
                    </div>
                    {runnerTotal > 0 && (
                      <div className="flex items-center justify-between text-[13px] font-medium text-[#94a3b8]">
                        <span>Runner Fees ({runnerCount} item{runnerCount > 1 ? 's' : ''})</span>
                        <span className="text-slate-900 font-bold">RM {runnerTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[13px] font-medium text-[#94a3b8]">
                      <span>Platform Fee</span>
                      <span className="text-slate-900 font-bold">RM {PLATFORM_FEE.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[15px] font-bold text-slate-900">Order Total</span>
                      <span className="text-[20px] font-semibold text-slate-900">RM {orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                    <ShieldCheck size={16} className="text-slate-900 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
                      Transactions are held in escrow until you confirm receipt. Real-time GPS verification ensures secure campus delivery.
                    </p>
                  </div>
                </section>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/*  STICKY FOOTER  */}
      {selectedItems.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
          <button
            onClick={handleCheckout}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-slate-900/10"
          >
            Checkout ({selectedCount}) <ArrowRight size={18} />
          </button>
        </footer>
      )}

      
    </main>
  );
}
