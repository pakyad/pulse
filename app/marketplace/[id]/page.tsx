"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, runTransaction, collection } from 'firebase/firestore';
import { ArrowLeft, ShoppingCart, ShieldCheck, Zap, Package, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ItemDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      const docRef = doc(db, "items", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchItem();
  }, [id]);

  const handleBuy = async () => {
    if (!auth.currentUser) return router.push('/auth');
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, "items", id as string);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) throw "Item has been removed from the Pulse.";
        
        const currentStock = itemDoc.data().stock_count ?? itemDoc.data().stock;
        
        if (currentStock <= 0) throw "Stock depleted. This hustle is currently closed.";

        // 1. Atomic Stock Decrement
        transaction.update(itemRef, { 
            stock_count: currentStock - 1 
        });

        // 2. Encrypted Transaction Manifest
        const txRef = doc(collection(db, "transactions"));
        const claimToken = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        transaction.set(txRef, {
          item_id: id,
          title: itemDoc.data().title,
          price: itemDoc.data().price,
          image_url: itemDoc.data().image_url,
          buyer_id: auth.currentUser.uid,
          seller_id: itemDoc.data().seller_id,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          claim_token: claimToken,
          protocol: 'QR_HANDSHAKE'
        });
      });

      // Redirect to Identity Hub to witness the active Pulse
      router.push('/me');
    } catch (e: any) {
      alert(e.message || e);
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-pearl">
            <div className="w-12 h-12 bg-navy animate-pulse rounded-xl" />
            <p className="mt-6 text-[10px] font-black text-navy/20 uppercase tracking-[0.5em]">Fetching Intel...</p>
        </div>
    );
  }

  const stock = item.stock_count ?? item.stock;

  return (
    <div className="min-h-screen bg-pearl pb-24 relative overflow-x-hidden">
      {/* Cinematic Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <motion.button 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => router.back()} 
            className="absolute top-12 left-6 z-20 soft-lens p-4 rounded-full bg-white/40 shadow-xl border border-white/40"
        >
          <ArrowLeft size={20} className="text-navy" />
        </motion.button>
        
        <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={item.image_url} 
            className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pearl via-transparent to-transparent" />
      </div>

      {/* Item Detail Card */}
      <div className="px-6 -mt-32 relative z-10 max-w-2xl mx-auto">
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="hologram-card p-10 bg-white/80 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,31,63,0.15)] ring-1 ring-navy/5"
        >
          <header className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] text-orange font-black uppercase tracking-[0.3em] mb-2 leading-none">Market Handshake</p>
              <h1 className="text-4xl font-black text-navy uppercase tracking-tighter leading-tight italic">{item.title}</h1>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-navy/40 font-black uppercase tracking-widest mb-1">Value</p>
                <p className="text-3xl font-black text-navy italic tracking-tighter tabular-nums">RM {item.price.toFixed(2)}</p>
            </div>
          </header>

          <div className="flex flex-wrap gap-3 mb-10">
            <div className="soft-lens px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-navy/5">
              <ShieldCheck size={16} className="text-green-500" />
              <span className="text-[10px] font-black text-navy uppercase tracking-widest">Pulse Verified</span>
            </div>
            <div className="soft-lens px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-navy/5">
              <Package size={16} className="text-navy/40" />
              <span className="text-[10px] font-black text-navy uppercase tracking-widest">{stock} Slots Remaining</span>
            </div>
            <div className="soft-lens px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-navy/5">
              <Clock size={16} className="text-navy/40" />
              <span className="text-[10px] font-black text-navy uppercase tracking-widest">Instant Deploy</span>
            </div>
          </div>

          <button 
            disabled={loading || stock <= 0}
            onClick={handleBuy}
            className="w-full bg-navy text-white p-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-orange hover:shadow-[0_20px_40px_rgba(255,133,27,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
          >
            {loading ? (
                <>
                    <Zap size={20} className="animate-spin" />
                    Synchronizing...
                </>
            ) : stock <= 0 ? (
                'Inventory Depleted'
            ) : (
                <>
                    <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" />
                    Execute Handshake
                </>
            )}
          </button>
          
          <p className="text-center mt-6 text-[9px] text-navy/40 font-black uppercase tracking-widest">
            Atomic Transaction secures your Hustle Points instantly upon verification.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
