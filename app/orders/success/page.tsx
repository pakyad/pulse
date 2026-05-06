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

  useEffect(() => {
    if (!orderId) {
      router.push('/marketplace');
      return;
    }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'orders', orderId));
          if (snap.exists()) {
            setOrder(snap.data());
          }
        } catch (error) {
          console.error("Registry Handshake Failed:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/auth');
      }
    });

    return () => unsub();
  }, [orderId, router]);

  if (loading || !order) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-[1.5px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 pt-20 pb-24 font-sans antialiased overflow-y-auto">
      
      {/* ── Institutional Success Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10 text-center"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
          <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Order Confirmed</h1>
        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Entry Registered in Pulse Ledger</p>
      </motion.div>

      {/* ── The Main Proof Card (Institutional DNA) ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-4xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 mb-10"
      >
        
        {/* 1. Picture Proof Section */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Picture Proof</h3>
          <div className="aspect-[2/1] bg-slate-50 rounded-3xl relative overflow-hidden flex items-center justify-center group border border-slate-100">
             <img 
               src={order.imageUrl || `https://picsum.photos/seed/${order.itemId}/800/400`} 
               className="w-full h-full object-cover transition-transform group-hover:scale-105 opacity-90" 
               alt="Proof" 
             />
             <div className="absolute bottom-4 right-4 bg-emerald-600 text-white font-bold text-[9px] px-3 py-2 rounded-xl border border-white/20 shadow-xl uppercase tracking-widest">
               Item Verified
             </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3 font-semibold uppercase tracking-widest opacity-60">
            Institutional Verification Hash: {orderId?.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* 2. Live Handshake Proof */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Handshake Node</h3>
          <div className="h-36 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden shadow-inner">
             {/* Subtle Institutional Grid */}
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             
             {/* Node Connections */}
             <svg className="absolute inset-0 w-full h-full">
                <motion.path 
                  d="M 80 100 Q 150 40 260 70" 
                  fill="none" 
                  stroke="#1B3C35" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
             </svg>

             <div className="absolute top-[85px] left-[70px] flex flex-col items-center">
                <div className="w-6 h-6 bg-slate-900 rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-400 mt-2 tracking-widest">Vendor</span>
             </div>

             <div className="absolute top-[55px] right-[70px] flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-2xl border-2 border-white shadow-xl flex items-center justify-center">
                   <MapPin size={16} className="text-white fill-white" />
                </div>
                <span className="text-[8px] font-bold uppercase text-accent mt-2 tracking-[0.2em]">Collector</span>
             </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 px-1">
             <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-slate-300" />
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
                  Handshake Node Active. <span className="text-slate-400">1m ago</span>
                </span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase">Live</span>
             </div>
          </div>
        </div>

        {/* 3. Ledger Entry */}
        <div className="pt-8 border-t border-slate-100 space-y-5">
           <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Asset</span>
              <span className="text-[14px] font-bold text-slate-900 tracking-tight">{order.title || 'Institutional Asset'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Registry Value</span>
              <span className="text-[22px] font-bold text-slate-900">RM {Number(order.price || 0).toFixed(2)}</span>
           </div>
        </div>
      </motion.div>

      {/* ── Global Action Terminal ── */}
      <div className="w-full max-w-sm mt-auto">
        <Link href={`/orders/${orderId}`}>
          <button className="w-full h-16 bg-accent text-white rounded-3xl font-bold text-[15px] flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-2xl shadow-accent/20 uppercase tracking-widest">
            Open Logistics Node <ArrowRight size={20} strokeWidth={3} />
          </button>
        </Link>
      </div>

    </main>
  );
}
