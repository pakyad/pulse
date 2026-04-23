"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  Package, MapPin, Clock, ChevronLeft, Zap,
  Truck, Search, Bell, Radio, InboxIcon
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── Ian Earn Badge ──
function EarnBadge({ price }: { price: number }) {
  const runnerCut = (price * 0.15).toFixed(2); // runner earns 15% of order value
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
      <Zap size={11} className="text-emerald-500 fill-emerald-500" />
      <span className="text-[10px] font-black text-emerald-600">Earn RM {runnerCut}</span>
    </div>
  );
}

// ── Ian Delivery Card ──
// Ian: data-forward. Left accent border. Precise earn amount. Clear pickup → drop-off flow.
function DeliveryCard({ order, onAccept, isAccepting }: { order: any; onAccept: (id: string) => void; isAccepting: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white border border-slate-100 border-l-4 border-l-accent rounded-2xl p-4 shadow-sm"
    >
      {/* Top row: item + earn badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {order.image_url ? (
            <img src={order.image_url} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt={order.title} />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Package size={18} className="text-slate-300" />
            </div>
          )}
          <div>
            <h3 className="text-[14px] font-bold text-navy leading-tight line-clamp-1">{order.title}</h3>
            <p className="text-[11px] text-slate-400 font-medium">From: {order.seller_name || 'Seller'}</p>
          </div>
        </div>
        <EarnBadge price={order.price || 0} />
      </div>

      {/* Route: seller → buyer drop-off */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-slate-300" />
          <span className="text-[11px] font-bold text-slate-400">Pick up from seller</span>
        </div>
        <div className="flex-1 h-px border-t border-dashed border-slate-200" />
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-accent" />
          <span className="text-[11px] font-bold text-navy">{order.drop_off_location || 'Buyer will specify'}</span>
        </div>
      </div>

      {/* Ian metadata row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock size={11} />
          <span className="text-[10px] font-bold">
            {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96, y: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          disabled={isAccepting}
          onClick={() => onAccept(order.id)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-[12px] font-bold disabled:opacity-50 shadow-lg shadow-navy/15"
        >
          {isAccepting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
          ) : (
            <>
              <Truck size={14} />
              Accept Delivery
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function MissionBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }

      onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));

      // Pending notifications for bell
      const qPending = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
      onSnapshot(qPending, (snap) => setPendingCount(snap.docs.length));

      // ── Real deliveries available for runners ──
      // Query: orders needing a runner, not yet assigned
      const qOrders = query(
        collection(db, 'transactions'),
        where('delivery_type', '==', 'RUNNER'),
        where('status', '==', 'AWAITING_RUNNER')
      );
      const unsubOrders = onSnapshot(qOrders, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort newest first client-side
        docs.sort((a: any, b: any) => {
          const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bT - aT;
        });
        setOrders(docs);
        setLoading(false);
      });

      return () => unsubOrders();
    });
    return () => unsubAuth();
  }, []);

  const handleAccept = async (orderId: string) => {
    if (!auth.currentUser || !profile) return;
    setAcceptingId(orderId);
    try {
      await updateDoc(doc(db, 'transactions', orderId), {
        runner_id: auth.currentUser.uid,
        runner_name: profile.full_name || 'Runner',
        status: 'ON_THE_WAY',
        accepted_at: new Date().toISOString(),
      });
      // Navigate to active delivery screen
      router.push(`/runner/active?order=${orderId}`);
    } catch (err) {
      console.error('Accept failed:', err);
      alert('Could not accept this delivery. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <div className="flex-1">
          <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3">
            <Search size={18} className="text-slate-300" />
            <span className="text-[13px] font-bold text-slate-300">Search...</span>
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 text-navy/40">
            <Bell size={22} strokeWidth={2} />
            {pendingCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">
                {pendingCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Runner'} />
        </div>
      </nav>

      {/* ── HEADER ── Ian: clean data header */}
      <section className="px-6 pt-32 pb-2">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-navy">Deliveries</h1>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">Available right now on campus</p>
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Ian count label */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            {loading ? '—' : orders.length} order{orders.length !== 1 ? 's' : ''} waiting
          </span>
        </div>
      </section>

      {/* ── DELIVERIES LIST ── */}
      <section className="px-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-28 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <AnimatePresence>
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
              >
                <DeliveryCard
                  order={order}
                  onAccept={handleAccept}
                  isAccepting={acceptingId === order.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          // Ian empty state: factual, simple
          <div className="py-20 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
              <InboxIcon size={28} className="text-slate-200" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-navy">No deliveries right now</p>
              <p className="text-[12px] text-slate-400 font-medium mt-1">Check back soon — orders come in throughout the day</p>
            </div>
          </div>
        )}
      </section>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
