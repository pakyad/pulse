'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, runTransaction, collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  ChevronLeft, Heart, ShieldCheck, ShoppingBag, Star,
  MessageSquare, Bell, MapPin, Truck, X, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── Marzia Drop-Off Locations ──
const DROP_OFF_SPOTS = [
  { id: 'k', label: 'Block K', sub: 'Main Lobby' },
  { id: 'n', label: 'Block N', sub: 'Ground Floor' },
  { id: 'lib', label: 'Library', sub: 'Level 1 entrance' },
  { id: 'cafe', label: 'Cafe', sub: 'Student cafe' },
  { id: 'sport', label: 'Sports Complex', sub: 'Main gate' },
  { id: 'bus', label: 'Bus Stop A', sub: 'Near main road' },
];

// ── Josh Voxel Stock Badge ──
// Josh: blocky, pixelated, digital. Tells you "how many left" with authority.
function JoshStockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl">
      <div className="w-1.5 h-1.5 rounded-sm bg-slate-300" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of stock</span>
    </div>
  );
  if (stock <= 3) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-xl border border-red-100">
      <div className="w-1.5 h-1.5 rounded-sm bg-red-400 animate-pulse" />
      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Only {stock} left</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
      <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{stock} in stock</span>
    </div>
  );
}

// ── Marzia Delivery Choice Sheet ──
// Warm, conversational, clear. No forms, no friction.
function MarziaDeliverySheet({
  item, onConfirm, onClose, loading,
}: {
  item: any;
  onConfirm: (type: 'SELF_COLLECT' | 'RUNNER', location?: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [choice, setChoice] = useState<'SELF_COLLECT' | 'RUNNER' | null>(null);
  const [location, setLocation] = useState(DROP_OFF_SPOTS[0].id);

  const selectedSpot = DROP_OFF_SPOTS.find(s => s.id === location)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-300 bg-navy/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#FDFDFD] rounded-t-4xl overflow-hidden"
      >
        {/* Sheet Header — Institutional Sync */}
        <div className="px-8 pt-6 pb-6 border-b-[0.5px] border-slate-50">
          <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6" />
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-navy tracking-tight">Fulfillment Selection</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-8 py-8 space-y-3">
          {/* Choice A — Collect */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setChoice('SELF_COLLECT')}
            className={`w-full min-h-[72px] p-4 rounded-2xl border-[0.5px] text-left transition-all flex items-center gap-4 ${
              choice === 'SELF_COLLECT'
                ? 'border-black bg-black text-white'
                : 'border-slate-100 bg-white text-navy'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              choice === 'SELF_COLLECT' ? 'bg-white/10' : 'bg-slate-50'
            }`}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-none">Self-Collection</p>
              <p className={`text-[12px] font-normal mt-1 opacity-60`}>
                Direct handover at campus hotspots
              </p>
            </div>
          </motion.button>

          {/* Choice B — Runner */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setChoice('RUNNER')}
            className={`w-full min-h-[72px] p-4 rounded-2xl border-[0.5px] text-left transition-all flex items-center gap-4 ${
              choice === 'RUNNER'
                ? 'border-black bg-black text-white'
                : 'border-slate-100 bg-white text-navy'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              choice === 'RUNNER' ? 'bg-white/10' : 'bg-slate-50'
            }`}>
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-none">Institutional Runner</p>
              <p className={`text-[12px] font-normal mt-1 opacity-60`}>
                Delivery via verified peer network
              </p>
            </div>
          </motion.button>

          {/* Location Grid — Black Selection */}
          <AnimatePresence>
            {choice === 'RUNNER' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="pt-4 space-y-3"
              >
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Select Hub</p>
                <div className="grid grid-cols-2 gap-2">
                  {DROP_OFF_SPOTS.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => setLocation(spot.id)}
                      className={`h-[56px] px-4 rounded-xl border-[0.5px] text-left transition-all ${
                        location === spot.id
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-slate-100 text-navy'
                      }`}
                    >
                      <p className="text-[13px] font-bold leading-tight">{spot.label}</p>
                      <p className={`text-[11px] font-normal opacity-50`}>{spot.sub}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm CTA — Black */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            disabled={!choice || loading}
            onClick={() => {
              if (!choice) return;
              const loc = choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined;
              onConfirm(choice, loc);
            }}
            className="w-full h-[60px] bg-black text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 disabled:opacity-40 transition-all shadow-none mt-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
              : !choice
              ? <span className="text-white/30">Select fulfillment method</span>
              : <>
                  <ShoppingBag size={18} />
                  Confirm — RM {Number(item.price).toFixed(2)}
                </>
            }
          </motion.button>

          {/* Safe spacer for iOS home indicator */}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));
        const q = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
        onSnapshot(q, (snap) => setNotificationCount(snap.docs.length));
      }
    });

    const fetchItem = async () => {
      const docRef = doc(db, 'items', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() });
      setPageLoading(false);
    };
    fetchItem();
    return () => unsubAuth();
  }, [id]);

  const handleConfirmOrder = async (deliveryType: 'SELF_COLLECT' | 'RUNNER', dropOffLocation?: string) => {
    if (!auth.currentUser) return router.push('/auth');
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'items', id as string);
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) throw new Error('This item is no longer available.');
        const rawStock = itemDoc.data().stock_count;
        const currentStock = rawStock !== undefined ? rawStock : (itemDoc.data().stock !== undefined ? itemDoc.data().stock : 99);
        
        // Only block if stock is explicitly tracked and zero
        if (currentStock <= 0) throw new Error('This item is out of stock.');
        
        // Only update stock if it was actually tracked (not the 99 default)
        if (rawStock !== undefined || itemDoc.data().stock !== undefined) {
          transaction.update(itemRef, { stock_count: currentStock - 1 });
        }

        const txRef = doc(collection(db, 'orders'));
        transaction.set(txRef, {
          item_id: id,
          title: itemDoc.data().title,
          price: itemDoc.data().price,
          image_url: itemDoc.data().image_url,
          buyer_id: auth.currentUser!.uid,
          buyer_name: profile?.full_name || 'Student',
          seller_id: itemDoc.data().seller_id,
          seller_name: itemDoc.data().seller_name || 'Seller',
          status: 'PENDING_VENDOR',
          delivery_type: deliveryType,
          drop_off_location: dropOffLocation ?? null,
          created_at: new Date().toISOString(),
          order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
      });
      setShowDeliverySheet(false);
      router.push('/me/orders');
    } catch (e: any) {
      alert(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center gap-4">
      <Package size={48} className="text-slate-200" />
      <p className="text-[14px] font-bold text-slate-400">Item not found</p>
      <button onClick={() => router.back()} className="text-[13px] font-bold text-accent">Go back</button>
    </div>
  );

  const stock = item.stock_count ?? item.stock ?? 99; // Default to 99 if untracked to prevent "Out of Stock" bug
  const isOutOfStock = stock <= 0;

  return (
    <div className="min-h-screen bg-white font-sans text-navy antialiased">

      {/* ── MINIMAL NAVIGATION CONTROL ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => router.back()}
        className="fixed top-8 left-6 z-[110] p-2 rounded-xl bg-white/80 backdrop-blur-xl border-[0.5px] border-slate-100 flex items-center justify-center text-navy shadow-sm"
      >
        <ChevronLeft size={28} strokeWidth={2} />
      </motion.button>

      {/* ── RAW-HD PRODUCT CANVAS ── */}
      <div className="relative w-full aspect-square bg-[#F8F9FA] overflow-hidden">
        {item.image_url && (
          <img
            src={item.image_url}
            className="w-full h-full object-contain"
            alt={item.title}
          />
        )}
      </div>

      {/* ── INSTITUTIONAL PRODUCT DATASHEET ── */}
      <div className="px-6 pt-10 pb-48 space-y-12">
        
        {/* Prime Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-[20px] font-bold text-navy tracking-tight leading-tight max-w-[75%]">
              {item.title}
            </h1>
            <p className="text-[22px] font-bold text-navy tabular-nums">
              RM {Number(item.price).toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                Institutional Registry: Active
             </p>
          </div>
        </div>

        {/* System Specifications (Auto-Description Logic) */}
        <div className="space-y-1">
           <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Specifications</h3>
           <div className="grid grid-cols-1 border-t-[0.5px] border-slate-100">
              {[
                { label: 'Condition', value: item.condition || 'Institutional Standard' },
                { label: 'Category', value: `${item.category} / ${item.subCategory || 'General'}` },
                { label: 'Fulfillment', value: (item.meetup_enabled ? 'Meet-up' : '') + (item.meetup_enabled && item.delivery_enabled ? ' & ' : '') + (item.delivery_enabled ? 'Delivery' : '') },
                { label: 'Location', value: item.meetup_location || 'Campus Wide' },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between py-4 border-b-[0.5px] border-slate-50">
                   <span className="text-[13px] font-medium text-slate-400">{spec.label}</span>
                   <span className="text-[13px] font-bold text-navy">{spec.value}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Narrative Description */}
        {item.description && (
          <div className="space-y-3">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Provenance</h3>
            <p className="text-[14px] text-slate-500 leading-relaxed font-medium italic">
              "{item.description}"
            </p>
          </div>
        )}

        {/* Seller Trust Module */}
        <div className="pt-8 flex items-center justify-between border-t-[0.5px] border-slate-100">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 border-[0.5px] border-slate-100 overflow-hidden flex items-center justify-center">
                {item.seller_photo ? (
                  <img src={item.seller_photo} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-bold text-slate-300">{item.seller_name?.[0]}</span>
                )}
              </div>
              <div>
                <p className="text-[14px] font-bold text-navy">{item.seller_name || 'Verified Student'}</p>
                <div className="flex items-center gap-1">
                   <Star size={10} className="fill-amber-400 text-amber-400" />
                   <span className="text-[11px] font-bold text-slate-400">4.9 · Marketplace Vetted</span>
                </div>
              </div>
           </div>
           <ShieldCheck size={18} className="text-emerald-500" />
        </div>
      </div>

      {/* ── INTEGRATED BUYING FLOW TRIGGER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] px-6 py-8 bg-white/90 backdrop-blur-2xl border-t-[0.5px] border-slate-100 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full border-[0.5px] border-slate-200 flex items-center justify-center text-navy hover:bg-slate-50 transition-colors"
        >
          <MessageSquare size={20} strokeWidth={1.5} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isOutOfStock || loading}
          onClick={() => setShowDeliverySheet(true)}
          className={`flex-1 h-14 rounded-full font-bold text-[15px] flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : 'bg-black text-white shadow-none'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
          ) : isOutOfStock ? (
            'Closed'
          ) : (
            <>Order Now — RM {Number(item.price).toFixed(2)}</>
          )}
        </motion.button>
      </div>

      {/* ── DELIVERY SHEET (Marzia Flow) ── */}
      <AnimatePresence>
        {showDeliverySheet && (
          <MarziaDeliverySheet
            item={item}
            onConfirm={handleConfirmOrder}
            onClose={() => setShowDeliverySheet(false)}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
