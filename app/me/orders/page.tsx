'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, History, ShoppingBag, Truck, Home, Check, MapPin, ChevronRight } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const q = query(
        collection(db, 'transactions'),
        where('buyer_id', '==', user.uid),
        where('status', 'in', ['PENDING', 'PREPARING', 'PACKED', 'AWAITING_RUNNER', 'ON_THE_WAY', 'READY_FOR_PICKUP']),
      );

      const unsub = onSnapshot(q, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrder(docs[0] || null);
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
  }, [router]);

  const getPhase = (s: string) => {
    if (s === 'PENDING') return 1;
    if (s === 'PREPARING' || s === 'PACKED') return 2;
    if (s === 'AWAITING_RUNNER' || s === 'ON_THE_WAY') return 3;
    if (s === 'READY_FOR_PICKUP' || s === 'COMPLETED') return 4;
    return 1;
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#F2F2F7] border-t-teal-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-navy max-w-md mx-auto relative pb-40">
      
      {/* ── HEADER ── */}
      <nav className="px-6 pt-16 pb-8 flex items-center justify-between border-b-[0.5px] border-[#F2F2F7]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/me')} className="p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-all">
            <ChevronLeft size={28} strokeWidth={2} className="text-navy" />
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-navy">Order Status</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-full border-[0.5px] border-[#F2F2F7] text-[13px] font-bold text-navy hover:bg-slate-50 transition-all">Help</button>
          <button onClick={() => router.push('/me/orders/history')} className="w-10 h-10 rounded-full bg-[#FDFDFD] flex items-center justify-center border-[0.5px] border-[#F2F2F7] hover:bg-slate-50 transition-all">
            <History size={18} className="text-navy" />
          </button>
        </div>
      </nav>

      <div className="px-6 py-10 space-y-12">
        {!order ? (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <h2 className="text-[18px] font-bold text-navy tracking-tight mb-2">No active orders</h2>
            <p className="text-[14px] text-slate-400 font-medium px-12">Your ongoing orders will appear here.</p>
          </div>
        ) : (
          <>
            {/* Status Section */}
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-[24px] font-bold text-navy tracking-tighter">Your order is confirmed</h2>
                <p className="text-[15px] font-bold text-teal-600">
                   {order.status === 'PENDING' && 'Waiting for seller...'}
                   {order.status === 'PREPARING' && 'Preparing your item'}
                   {order.status === 'PACKED' && 'Item is packed'}
                   {order.status === 'AWAITING_RUNNER' && 'Waiting for runner'}
                   {order.status === 'ON_THE_WAY' && 'Item is on the way'}
                   {order.status === 'READY_FOR_PICKUP' && 'Ready for collection'}
                </p>
              </div>

              {/* Horizontal Tracker (Optical Whitespace) */}
              <div className="flex items-center justify-between relative px-2">
                 {[1, 2, 3, 4].map((step) => {
                   const phase = getPhase(order.status);
                   const active = phase >= step;
                   return (
                     <div key={step} className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 transition-all border-[0.5px] ${
                       active ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-white border-[#F2F2F7] text-slate-200'
                     }`}>
                        {step === 1 && <Check size={18} strokeWidth={3} />}
                        {step === 2 && <ShoppingBag size={18} />}
                        {step === 3 && <Truck size={18} />}
                        {step === 4 && <Home size={18} />}
                     </div>
                   )
                 })}
                 <div className="absolute left-10 right-10 h-[1px] bg-[#F2F2F7] top-[20px] -z-0">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(getPhase(order.status) - 1) * 33.33}%` }} 
                      className="h-full bg-teal-500/30" 
                    />
                 </div>
              </div>
            </div>

            {/* Flat Sections (Optical Spacing) */}
            <div className="space-y-12">
              
              {/* Product Card (Subtle Pod) */}
              <div className="p-5 rounded-[22px] border-[0.5px] border-[#F2F2F7] bg-[#FDFDFD] flex items-center gap-5">
                 <div className="w-16 h-16 rounded-[22px] bg-white overflow-hidden border-[0.5px] border-[#F2F2F7] shrink-0">
                    <img src={order.image_url} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-navy truncate">{order.title}</h3>
                    <p className="text-[13px] font-bold text-slate-400 mt-0.5">Sold by {order.seller_name}</p>
                 </div>
                 <ChevronRight size={18} className="text-[#F2F2F7]" />
              </div>

              {/* Detail Blocks */}
              <div className="space-y-8 px-1">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Fulfillment Details</p>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-teal-600" />
                    <p className="text-[15px] font-bold text-navy leading-none">
                       {order.delivery_type === 'RUNNER' ? 'Institutional Runner' : 'Self-Collection'} · {order.drop_off_location || 'Standard'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t-[0.5px] border-[#F2F2F7]">
                  <div className="flex items-center justify-between">
                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Receipt Settlement</p>
                     <p className="text-[10px] font-bold text-slate-200 tracking-widest">#{order.order_code}</p>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-[15px] font-bold text-navy">Total Paid</p>
                     <p className="text-[22px] font-bold text-navy tracking-tight">RM {Number(order.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-[13px] font-bold text-slate-400">Payment Via</p>
                     <div className="px-3 py-1 bg-teal-50 border-[0.5px] border-teal-100 rounded-lg">
                        <p className="text-[11px] font-black text-teal-600 uppercase tracking-widest">DuitNow QR</p>
                     </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Support Pod */}
            <button className="w-full py-5 rounded-[22px] border-[0.5px] border-[#F2F2F7] text-center font-bold text-navy text-[14px] hover:bg-slate-50 transition-all">
               Need help with this order?
            </button>
          </>
        )}
      </div>
    </main>
  );
}
