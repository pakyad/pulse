"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MapPin, Camera, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/marketplace');
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'parent_orders', orderId));
          if (snap.exists()) {
            setOrder(snap.data());
          } else {
            setNotFound(true);
          }
        } catch (error) {
          console.error("Registry Handshake Failed:", error);
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/auth');
      }
    });

    return () => unsub();
  }, [orderId, router]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-[1.5px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
       <div className="w-24 h-24 bg-red-50 rounded-[48px] flex items-center justify-center mb-8">
          <ShieldCheck className="w-12 h-12 text-red-600 opacity-20" />
       </div>
       <h1 className="text-[26px] font-black text-slate-900 tracking-tighter mb-2 leading-none">Registry Failure</h1>
       <p className="text-[14px] font-bold text-slate-400 mb-8 max-w-[280px]">Order ID could not be matched against the Pulse Institutional Ledger.</p>
       <button 
         onClick={() => router.push('/marketplace')}
         className="w-full max-w-[280px] h-16 bg-slate-900 text-white rounded-[28px] font-black text-[13px] uppercase tracking-widest"
       >
         Return to Node
       </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD] flex flex-col items-center px-8 pt-24 pb-24 font-sans antialiased overflow-y-auto">
      
      {/* ── Institutional Success Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-12 text-center"
      >
        <div className="w-24 h-24 bg-emerald-50 rounded-[48px] flex items-center justify-center mb-8 border border-emerald-100 shadow-sm">
          <Check className="w-12 h-12 text-emerald-600" strokeWidth={4} />
        </div>
        <h1 className="text-[26px] font-black text-slate-900 tracking-tighter leading-none mb-3">Order Confirmed</h1>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry Entry Finalized</p>
      </motion.div>

      {/* ── The Main Proof Card ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-[48px] border border-slate-50 shadow-2xl shadow-slate-200/50 p-8 mb-12"
      >
        
        {/* 1. Picture Proof Section */}
        <div className="mb-10">
          <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4 px-1">Institutional Proof</h3>
          <div className="aspect-video bg-slate-50 rounded-[32px] relative overflow-hidden flex items-center justify-center group border border-slate-50">
             <img 
               src={order.imageUrl || `https://picsum.photos/seed/${order.itemId}/800/450`} 
               className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-90" 
               alt="Proof" 
             />
             <div className="absolute bottom-5 right-5 bg-emerald-500 text-white font-black text-[10px] px-4 py-2 rounded-2xl border border-white/20 shadow-xl uppercase tracking-widest">
               Asset Verified
             </div>
          </div>
          <p className="text-[10px] text-slate-300 text-center mt-4 font-black uppercase tracking-[0.2em] opacity-60">
            Hash: {orderId?.slice(0, 12).toUpperCase()}
          </p>
        </div>

        {/* 2. Live Handshake Proof */}
        <div className="mb-10">
          <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-4 px-1">Network Synchronization</h3>
          <div className="h-40 bg-slate-50/50 rounded-[36px] border border-slate-50 relative overflow-hidden shadow-inner">
             {/* Subtle Institutional Grid */}
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             
             {/* Node Connections */}
             <svg className="absolute inset-0 w-full h-full">
                <motion.path 
                  d="M 80 110 Q 150 50 260 80" 
                  fill="none" 
                  stroke="#1B3C35" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
             </svg>

             <div className="absolute top-[95px] left-[70px] flex flex-col items-center">
                <div className="w-7 h-7 bg-slate-900 rounded-[10px] border-[3px] border-white shadow-xl flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-300 mt-3 tracking-widest">Merchant</span>
             </div>

             <div className="absolute top-[65px] right-[70px] flex flex-col items-center">
                <div className="w-9 h-9 bg-slate-900 rounded-[12px] border-[3px] border-white shadow-xl flex items-center justify-center">
                   <MapPin size={18} className="text-white fill-white" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-900 mt-3 tracking-[0.2em]">Resident</span>
             </div>
          </div>
          
          <div className="flex items-center justify-between mt-5 px-1">
             <div className="flex items-center gap-3">
                <Clock size={16} className="text-slate-300" />
                <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">
                  Handshake Locked <span className="text-slate-300 font-bold ml-1">Live</span>
                </span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             </div>
          </div>
        </div>

        {/* 3. Ledger Entry */}
        <div className="pt-10 border-t border-slate-50 space-y-6">
           <div className="flex justify-between items-start">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Assets</span>
              <span className="text-[15px] font-black text-slate-900 tracking-tight text-right max-w-[60%] leading-tight">{order.items_summary || 'Institutional Assets'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Ledger Total</span>
              <span className="text-[28px] font-black text-slate-900 tracking-tighter leading-none">RM{Number(order.total_price || 0).toFixed(0)}</span>
           </div>
        </div>
      </motion.div>

      {/* ── Global Action Terminal ── */}
      <div className="w-full max-w-sm mt-auto">
        <Link href="/orders">
          <button className="w-full h-18 bg-slate-900 text-white rounded-[32px] font-black text-[15px] flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 uppercase tracking-[0.2em]">
            Open Orders Ledger <ArrowRight size={20} strokeWidth={3} />
          </button>
        </Link>
      </div>

    </main>
  );
}
