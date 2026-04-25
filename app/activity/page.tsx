'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import {
  Package,
  ShoppingBag,
  Bell,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  InboxIcon,
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── Ian Status Badge ──
// Ian's language: precise, no nonsense, color-coded data.
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    PENDING:          { label: 'Pending',        color: 'bg-amber-50 text-amber-600 border-amber-100',   dot: 'bg-amber-400 animate-pulse' },
    AWAITING_RUNNER:  { label: 'Finding runner', color: 'bg-blue-50 text-blue-600 border-blue-100',      dot: 'bg-blue-400 animate-pulse' },
    ON_THE_WAY:       { label: 'On the way',     color: 'bg-violet-50 text-violet-600 border-violet-100', dot: 'bg-violet-400 animate-pulse' },
    COLLECTED:        { label: 'Done',           color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400' },
    COMPLETE:         { label: 'Done',           color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400' },
  };
  const s = map[status] ?? { label: status, color: 'bg-slate-50 text-slate-400 border-slate-100', dot: 'bg-slate-300' };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </div>
  );
}

// ── Ian Order Card ──
// Ian: left border accent = status color. Monospaced order code. Structured hierarchy.
function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const borderColor: Record<string, string> = {
    PENDING: 'border-l-amber-400',
    AWAITING_RUNNER: 'border-l-blue-400',
    ON_THE_WAY: 'border-l-violet-400',
    COLLECTED: 'border-l-emerald-400',
    COMPLETE: 'border-l-emerald-400',
  };
  const border = borderColor[order.status] ?? 'border-l-slate-200';

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-100 border-l-4 ${border} rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:shadow-navy/5 transition-all group`}
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all">
        {order.status === 'COLLECTED' || order.status === 'COMPLETE'
          ? <CheckCircle2 size={18} className="text-emerald-400 group-hover:text-white transition-colors" />
          : order.status === 'ON_THE_WAY'
          ? <Truck size={18} className="text-slate-400 group-hover:text-white transition-colors" />
          : <ShoppingBag size={18} className="text-slate-400 group-hover:text-white transition-colors" />
        }
      </div>

      {/* Content — Ian's data hierarchy */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[9px] text-slate-300 tracking-widest">
            #{order.id?.slice(0, 8).toUpperCase()}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <h3 className="text-[14px] font-bold text-navy leading-tight truncate">{order.title}</h3>
        <p className="text-[12px] text-slate-400 font-medium mt-0.5">
          RM {Number(order.price || 0).toFixed(2)}
          {order.delivery_type === 'RUNNER' && ' · Runner delivery'}
          {order.delivery_type === 'SELF_COLLECT' && ' · Self collect'}
        </p>
      </div>

      <ChevronRight size={16} className="text-slate-200 group-hover:text-navy transition-colors shrink-0" />
    </motion.button>
  );
}

// ── Ian Announcement Card ──
// Ian: clean, no-nonsense feed item. Left rule instead of border.
function AnnouncementCard({ ann, onClick }: { ann: any; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:shadow-navy/5 transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all">
        <Megaphone size={18} className="text-slate-400 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Campus Update</span>
        <h3 className="text-[14px] font-bold text-navy leading-tight truncate">{ann.title || ann.headline}</h3>
        <p className="text-[12px] text-slate-400 font-medium mt-0.5 line-clamp-1">{ann.content || ann.subline || ''}</p>
      </div>
      <ChevronRight size={16} className="text-slate-200 group-hover:text-navy transition-colors shrink-0" />
    </motion.button>
  );
}

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'feed'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { setLoading(false); return; }

      // Profile
      onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));

      // Pending count for bell badge
      const qPending = query(
        collection(db, 'transactions'),
        where('buyer_id', '==', user.uid),
        where('status', '==', 'PENDING')
      );
      onSnapshot(qPending, (snap) => setPendingCount(snap.docs.length));

      // My Orders — only this user's purchases
      const qOrders = query(
        collection(db, 'transactions'),
        where('buyer_id', '==', user.uid)
      );
      const unsubOrders = onSnapshot(qOrders, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort newest first client-side (avoids composite index requirement)
        docs.sort((a: any, b: any) => {
          const aDate = a.created_at?.seconds ?? new Date(a.created_at).getTime() / 1000 ?? 0;
          const bDate = b.created_at?.seconds ?? new Date(b.created_at).getTime() / 1000 ?? 0;
          return bDate - aDate;
        });
        setOrders(docs);
        setLoading(false);
      });

      // Campus Feed — announcements only
      const qAnn = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
      const unsubAnn = onSnapshot(qAnn, (snap) => {
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubOrders(); unsubAnn(); };
    });

    return () => unsubAuth();
  }, []);

  const TABS = [
    { id: 'orders', label: 'My Orders', count: orders.length },
    { id: 'feed',   label: 'Campus Feed', count: announcements.length },
  ] as const;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>

        <div className="flex-1">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3"
          >
            <Search size={18} className="text-slate-300" />
            <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 active:scale-90 text-accent">
            <Bell size={22} strokeWidth={2.5} />
            {pendingCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">
                {pendingCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
        </div>
      </nav>

      {/* ── HEADER ── Ian: clean, minimal page header */}
      <section className="px-6 pt-32 pb-2">
        <h1 className="text-[28px] font-bold tracking-widest text-navy mb-6">My Activity</h1>

        {/* ── IAN TAB BAR ── Precise underline, no fluff */}
        <div className="flex gap-0 border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 pr-6 text-[13px] font-bold transition-colors ${
                activeTab === tab.id ? 'text-navy' : 'text-slate-300 hover:text-slate-400'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  activeTab === tab.id ? 'bg-navy text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="ian-tab-underline"
                  className="absolute bottom-0 left-0 right-6 h-[2px] bg-navy rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="px-6 pt-6">
        <AnimatePresence mode="wait">

          {/* ── MY ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Ian: section label */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Live</span>
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-20 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <OrderCard
                        order={order}
                        onClick={() => router.push(`/orders/${order.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Ian empty state: simple, factual, no drama
                <div className="py-20 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                    <InboxIcon size={28} className="text-slate-200" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-navy">No orders yet</p>
                    <p className="text-[12px] text-slate-400 font-medium mt-1">Browse the marketplace to get started</p>
                  </div>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/marketplace')}
                    className="mt-2 px-6 py-3 bg-navy text-white rounded-xl text-[12px] font-bold"
                  >
                    Browse Marketplace
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── CAMPUS FEED TAB ── */}
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  Campus announcements
                </span>
              </div>

              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((ann, i) => (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <AnnouncementCard
                        ann={ann}
                        // ✅ Fixed: announcements route to /pulse, not /orders/[id]
                        onClick={() => router.push('/pulse')}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                    <Megaphone size={28} className="text-slate-200" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-navy">No announcements</p>
                    <p className="text-[12px] text-slate-400 font-medium mt-1">Check back later</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </section>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
