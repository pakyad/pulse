'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, History, PackageOpen, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

// ── Mock Active Data ──
// Empty for demoing the "Nothing's happening now" state, 
// or one item if we want to show "Current Orders only as a highlight"
const ACTIVE_ORDERS: any[] = [
  /*{
    id: 'ORD-8429',
    item: 'Nasi Lemak Ayam (Level 2)',
    merchant: 'Kak Yan Corner',
    price: 6.50,
    status: 'PREPARING',
    time: '8m ago',
    type: 'FOOD'
  }*/
];

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-navy max-w-md mx-auto border-x border-[#F2F2F7] relative">
      
      {/* ── HEADER ── */}
      <nav className="px-6 pt-16 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-navy/40 hover:text-navy transition-all active:scale-90 border border-[#F2F2F7]"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <h1 className="text-[18px] font-bold tracking-tight text-navy">Orders</h1>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/me/orders/history')}
          className="h-9 px-4 bg-[#F2F8FF] rounded-full flex items-center gap-2 border-transparent active:bg-slate-100 transition-colors"
        >
          <History size={15} className="text-[#1A1A1A]" strokeWidth={2.5} />
          <span className="text-[13px] font-medium text-[#1A1A1A]">History</span>
        </motion.button>
      </nav>

      {/* ── CONTENT ── */}
      <div className="px-6 pt-8">
        {ACTIVE_ORDERS.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.2em] px-1">Happening Now</h2>
            <div className="space-y-[0.5px] bg-[#F2F2F7] rounded-[24px] overflow-hidden border-[0.5px] border-[#F2F2F7]">
              {ACTIVE_ORDERS.map((order) => (
                <ActiveOrderRow key={order.id} order={order} />
              ))}
            </div>
          </div>
        ) : (
          /* ── EMPTY STATE ── */
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-56 h-56 mb-8 relative opacity-40 grayscale">
               <img 
                 src="/empty_activity.png" 
                 alt="Nothing's happening" 
                 className="w-full h-full object-contain"
               />
            </div>
            <h2 className="text-[18px] font-bold text-navy tracking-tight mb-2">Nothing's happening now</h2>
            <p className="text-[13px] text-slate-400 font-medium px-12 leading-relaxed">
              When you use our services, you'll see them here.
            </p>
          </div>
        )}
      </div>

      {/* ── FOOTER PADDING FOR NAV ── */}
      <div className="pb-32" />
    </main>
  );
}

function ActiveOrderRow({ order }: { order: any }) {
  return (
    <motion.button
      whileTap={{ backgroundColor: '#F9F9FB' }}
      className="w-full bg-white flex items-center justify-between p-5 text-left transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
          <Clock size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-black tracking-tight">{order.item}</span>
          <span className="text-[12px] text-slate-400 font-medium">{order.merchant}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-black text-navy tracking-tighter">RM {order.price.toFixed(2)}</p>
        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{order.status}</span>
      </div>
    </motion.button>
  );
}
