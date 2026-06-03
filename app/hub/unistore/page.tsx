'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ShieldCheck, Package, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/shared/ProductCard';

export default function UniStoreHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch only official merch (we will use seller_name 'UniStore Official' or is_official)
    // To ensure we get the Captain UniKL items, we query where is_official is true 
    // and sort manually or filter if needed.
    const q = query(
      collection(db, 'items'),
      where('is_official', '==', true)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Just to ensure UniStore items are prioritized, we can filter for the specific seeded seller
      const unistoreItems = data.filter((item: any) => 
        item.seller_name === 'UniStore Official' || 
        item.seller_name === 'Student Representative Council' ||
        item.title.toLowerCase().includes('captain')
      );
      
      setItems(unistoreItems.length > 0 ? unistoreItems : data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 pb-32 font-sans antialiased">
      
      {/* 1. STUNNING HERO BANNER */}
      <section className="relative w-full h-[320px] bg-linear-to-br from-[#FFC72C] to-[#E78B09] overflow-hidden rounded-b-[3rem] shadow-xl shadow-amber-500/10">
        
        {/* Massive Abstract Watermark */}
        <div className="absolute -bottom-12 -right-12 text-white/15 -rotate-12 pointer-events-none">
          <ShoppingBag size={280} strokeWidth={1.5} />
        </div>

        {/* Sharp Geometric Shapes */}
        <div className="absolute top-[-20%] right-[15%] w-64 h-64 border-40 border-white/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[40%] w-32 h-32 border-20 border-white/10 rounded-full pointer-events-none opacity-50" />
        
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        {/* Header Nav */}
        <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-10">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-all -ml-2 drop-shadow-sm"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-10 left-8 right-8 z-10 flex flex-col items-start space-y-2">
           <div className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-md">
             <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none drop-shadow-sm">Official Merchandise</p>
           </div>
           <h1 className="text-[32px] font-black text-white tracking-tight leading-none mt-2 drop-shadow-md">
             UniStore Hub
           </h1>
           <p className="text-[13px] font-medium text-white/90 mt-1 max-w-[250px] leading-relaxed drop-shadow-sm">
             Exclusive university apparel, accessories, and campus collectibles.
           </p>
        </div>

        {/* Decorative Texture overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 mix-blend-overlay pointer-events-none" />
      </section>

      {/* 2. THE CATALOG */}
      <div className="max-w-2xl mx-auto px-6 mt-10 space-y-8">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">The Collection</h3>
           <p className="text-[12px] font-bold text-slate-400">{items.length} Items</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="w-full aspect-4/5 bg-slate-200 rounded-3xl" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-slate-200 rounded-full" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => router.push(`/marketplace/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4 border border-dashed border-slate-200 rounded-3xl bg-white">
            <Package size={40} strokeWidth={1} />
            <p className="text-[13px] font-bold uppercase tracking-widest">No official stock available</p>
          </div>
        )}
      </div>

    </main>
  );
}
