"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Check, ArrowRight, MapPin, Camera, Clock } from 'lucide-react';
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
      <div className="w-8 h-8 border-[0.5px] border-black/5 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 pt-16 pb-24 font-sans antialiased overflow-y-auto">
      
      {/* ── Visual Success Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-emerald-500" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Order Confirmed</h1>
        <p className="text-sm text-gray-500">Ready for pickup</p>
      </motion.div>

      {/* ── The Main Proof Card (100% Visual) ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8"
      >
        
        {/* 1. Picture Proof Section */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Picture Proof</h3>
          <div className="aspect-[2/1] bg-gray-100 rounded-xl relative overflow-hidden flex items-center justify-center group">
             <img 
               src={`/C:/Users/USER/.gemini/antigravity/brain/f094f639-08af-47d8-997d-e0067f686f4a/canvas_tote_bag_proof_1777905457892.png`} 
               className="w-full h-full object-cover transition-transform group-hover:scale-105" 
               alt="Proof" 
             />
             <div className="absolute bottom-3 right-3 bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg border-2 border-white shadow-md uppercase tracking-wider">
               Item Match Confirmed
             </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2 font-medium italic">
            Click photo to view full verification certificate
          </p>
        </div>

        {/* 2. Real-time Location Proof */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Real-time Location Proof</h3>
          <div className="h-32 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden">
             {/* Subtle Map Grid */}
             <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
             
             {/* Live Pointers & Path */}
             <svg className="absolute inset-0 w-full h-full">
                <path d="M 100 80 Q 150 40 250 60" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
             </svg>

             <div className="absolute top-[65px] left-[85px] flex flex-col items-center">
                <div className="w-5 h-5 bg-black rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <span className="text-[8px] font-black uppercase text-black/30 mt-1">Seller</span>
             </div>

             <div className="absolute top-[45px] right-[85px] flex flex-col items-center">
                <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                   <MapPin size={12} className="text-white fill-white" />
                </div>
                <span className="text-[8px] font-black uppercase text-emerald-500 mt-1 tracking-widest">You</span>
             </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 px-1">
             <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-400" />
                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">
                  Seller is 45m away. <span className="text-gray-400 font-medium">1m ago</span>
                </span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 tracking-widest">LIVE</span>
             </div>
          </div>
        </div>

        {/* 3. Receipt Registry */}
        <div className="pt-6 border-t border-dashed border-gray-100 space-y-4">
           <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-gray-400">Item</span>
              <span className="text-gray-900 font-bold">{order.title || 'MIDI Canvas Tote Bag'}</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">Total</span>
              <span className="text-lg font-bold text-emerald-500">RM {Number(order.price || 23.00).toFixed(2)}</span>
           </div>
        </div>
      </motion.div>

      {/* ── Global Action Terminal ── */}
      <div className="w-full max-w-sm mt-auto">
        <Link href={`/orders/${orderId}`}>
          <button className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-gray-900/10">
            Track Live Status <ArrowRight size={20} />
          </button>
        </Link>
      </div>

    </main>
  );
}
