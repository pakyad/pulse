"use client";

import { useEffect, useState } from 'react';
import { subscribeToMarketplace } from '@/lib/marketplace-utils';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Search, ShoppingBag, Plus, ArrowLeft, Slidertoggles as SlidersHorizontal, Package, Zap } from 'lucide-react';
import Link from 'next/link';
import MarketplaceCard from '@/components/MarketplaceCard';
import CreateListing from '@/components/CreateListing';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // 1. Real-time Marketplace Signal
  useEffect(() => {
    const unsubscribe = subscribeToMarketplace((newItems) => {
        setItems(newItems);
        setIsSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Identity Verification for Deployment
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) setProfile({ id: user.uid, ...snap.data() });
        }
    });
    return unsub;
  }, []);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const handlePurchase = (itemId: string) => {
    console.log(`Synchronizing purchase for item: ${itemId}`);
    // Atomic checkout intent
  };

  return (
    <div className="pb-48 pt-24 min-h-screen bg-pearl">
      {/* Search Header */}
      <header className="px-6 max-w-7xl mx-auto mb-12">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-black text-navy tracking-tighter uppercase italic leading-none">The Market</h1>
            <div className="flex gap-2">
                <div className="p-3 bg-white border border-navy/5 rounded-2xl shadow-sm">
                    <ShoppingBag size={20} className="text-navy" />
                </div>
            </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-navy/20 group-focus-within:text-orange transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search hoodies, services, hustles..."
            className="soft-lens w-full pl-16 pr-6 py-6 rounded-[32px] text-sm font-bold text-navy border-none outline-none focus:ring-1 ring-orange/30 transition-all shadow-xl shadow-navy/5"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Synchronizing Signal */}
      <AnimatePresence>
          {isSyncing && (
            <motion.div 
               exit={{ opacity: 0, y: -20 }}
               className="flex flex-col items-center justify-center py-20 opacity-20"
            >
                <Zap size={40} className="text-navy animate-pulse mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Market Signal</p>
            </motion.div>
          )}
      </AnimatePresence>

      {/* The Hype Grid */}
      <main className="px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8 px-2">
            <div>
                <h2 className="text-xs font-black text-navy/40 uppercase tracking-[0.2em] mb-1">Live Inventory</h2>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-black text-navy uppercase">{filteredItems.length} Handshakes Available</p>
                </div>
            </div>
        </div>

        <motion.div 
            layout
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6"
        >
          <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <MarketplaceCard item={item} onPurchase={handlePurchase} />
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Floating Action Button */}
      {profile && (
          <button 
            onClick={() => setShowModal(true)}
            className="fixed bottom-10 right-10 bg-navy text-white p-6 rounded-[28px] shadow-[0_30px_60px_rgba(0,31,63,0.3)] hover:bg-orange hover:scale-110 active:scale-95 transition-all z-40 group border border-white/10"
          >
            <div className="relative">
                <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
            </div>
          </button>
      )}

      <AnimatePresence>
          {showModal && profile && (
            <CreateListing 
              userId={profile.id} 
              role={profile.role || 'STUDENT'} 
              onClose={() => setShowModal(false)} 
            />
          )}
      </AnimatePresence>
    </div>
  );
}
