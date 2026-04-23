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
      className="fixed inset-0 z-[300] bg-navy/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#FDFDFD] rounded-t-[2rem] overflow-hidden"
      >
        {/* Marzia handle + header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-50">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-navy leading-tight">How do you want it?</h2>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">
                {item.title} · <span className="text-navy font-bold">RM {Number(item.price).toFixed(2)}</span>
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-0.5">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Choice A — Collect */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setChoice('SELF_COLLECT')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
              choice === 'SELF_COLLECT'
                ? 'border-navy bg-navy'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            {/* Josh voxel icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${
              choice === 'SELF_COLLECT' ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'
            }`}>
              <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-sm ${
                choice === 'SELF_COLLECT' ? 'bg-white/20' : 'bg-slate-200'
              }`} />
              <ShoppingBag size={20} className={choice === 'SELF_COLLECT' ? 'text-white' : 'text-navy'} />
            </div>
            <div>
              <p className={`text-[15px] font-bold leading-none ${choice === 'SELF_COLLECT' ? 'text-white' : 'text-navy'}`}>
                I'll collect it
              </p>
              <p className={`text-[12px] font-medium mt-1 ${choice === 'SELF_COLLECT' ? 'text-white/50' : 'text-slate-400'}`}>
                Meet the seller, scan to confirm
              </p>
            </div>
          </motion.button>

          {/* Choice B — Runner */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setChoice('RUNNER')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
              choice === 'RUNNER'
                ? 'border-accent bg-accent'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${
              choice === 'RUNNER' ? 'bg-white/10' : 'bg-blue-50 border border-blue-100'
            }`}>
              <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-sm ${
                choice === 'RUNNER' ? 'bg-white/20' : 'bg-blue-100'
              }`} />
              <Truck size={20} className={choice === 'RUNNER' ? 'text-white' : 'text-accent'} />
            </div>
            <div>
              <p className={`text-[15px] font-bold leading-none ${choice === 'RUNNER' ? 'text-white' : 'text-navy'}`}>
                Deliver to me
              </p>
              <p className={`text-[12px] font-medium mt-1 ${choice === 'RUNNER' ? 'text-white/50' : 'text-slate-400'}`}>
                A runner brings it to your spot
              </p>
            </div>
          </motion.button>

          {/* Location picker — only when runner chosen */}
          <AnimatePresence>
            {choice === 'RUNNER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-1">
                  Drop-off spot
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DROP_OFF_SPOTS.map((spot) => (
                    <motion.button
                      key={spot.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLocation(spot.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        location === spot.id
                          ? 'bg-navy border-navy'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <MapPin size={11} className={location === spot.id ? 'text-white mb-1' : 'text-slate-300 mb-1'} />
                      <p className={`text-[11px] font-bold leading-none ${location === spot.id ? 'text-white' : 'text-navy'}`}>
                        {spot.label}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm CTA */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            disabled={!choice || loading}
            onClick={() => {
              if (!choice) return;
              const loc = choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined;
              onConfirm(choice, loc);
            }}
            className="w-full h-[60px] bg-navy text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 disabled:opacity-40 transition-all shadow-xl shadow-navy/15 mt-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
              : !choice
              ? <span className="text-white/50">Choose an option above</span>
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

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          item_id: id,
          title: itemDoc.data().title,
          price: itemDoc.data().price,
          image_url: itemDoc.data().image_url,
          buyer_id: auth.currentUser!.uid,
          buyer_name: profile?.full_name || 'Student',
          seller_id: itemDoc.data().seller_id,
          seller_name: itemDoc.data().seller_name || 'Seller',
          status: deliveryType === 'RUNNER' ? 'AWAITING_RUNNER' : 'PENDING',
          delivery_type: deliveryType,
          drop_off_location: dropOffLocation ?? null,
          created_at: new Date().toISOString(),
          order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
      });
      setShowDeliverySheet(false);
      router.push('/activity');
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
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased">

      {/* ── NAV (floats over image) ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-3 flex items-center justify-between">
        {/* Josh back button — voxel pod with 3D base */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="relative"
        >
          <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 rounded-2xl bg-black/10" />
          <div className="relative w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 flex items-center justify-center shadow-lg">
            <ChevronLeft size={20} strokeWidth={2.5} className="text-navy" />
          </div>
        </motion.button>

        <div className="flex items-center gap-2">
          {/* Bell */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/activity')} className="relative">
            <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 rounded-2xl bg-black/10" />
            <div className="relative w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 flex items-center justify-center shadow-lg">
              <Bell size={18} strokeWidth={2} className="text-navy" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-accent text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">
                  {notificationCount}
                </div>
              )}
            </div>
          </motion.button>

          {/* Heart */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setLiked(!liked)}
            className="relative"
          >
            <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 rounded-2xl bg-black/10" />
            <div className="relative w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 flex items-center justify-center shadow-lg">
              <Heart
                size={18}
                strokeWidth={2}
                className={liked ? 'fill-red-500 text-red-500' : 'text-navy'}
              />
            </div>
          </motion.button>

          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
        </div>
      </nav>

      {/* ── HERO IMAGE — Josh: full bleed, immersive ── */}
      <div className="relative w-full h-[55vh] bg-slate-100 overflow-hidden">
        {item.image_url && (
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            src={item.image_url}
            className="w-full h-full object-cover"
            alt={item.title}
          />
        )}
        {/* Gradient fade to sheet */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-[#FDFDFD]" />
      </div>

      {/* ── CONTENT SHEET — sits directly under the image, no overlap hack ── */}
      <div className="bg-[#FDFDFD] px-6 pt-6 pb-4">

        {/* Josh Category Badge */}
        <div className="flex items-center gap-3 mb-5">
          {/* Josh voxel badge — blocky, pixelated aesthetic */}
          <div className="relative">
            <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 rounded-xl bg-accent/20" />
            <div className="relative px-3 py-1.5 bg-white border border-accent/20 rounded-xl">
              <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">
                {item.category || 'Essential'}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-navy">4.9</span>
          </div>

          <div className="ml-auto">
            <JoshStockBadge stock={stock} />
          </div>
        </div>

        {/* ── Title + Price — Josh: BIG, direct ── */}
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-navy mb-2">
          {item.title}
        </h1>

        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-[36px] font-black text-navy tabular-nums leading-none">
            RM {Number(item.price).toFixed(2)}
          </span>
        </div>

        {/* ── Description — only if it exists ── */}
        {item.description && (
          <div className="mb-8">
            <p className="text-[14px] text-slate-500 leading-relaxed font-medium">{item.description}</p>
          </div>
        )}

        {/* ── Seller Row — Ian-precision, not a big card ── */}
        <Link
          href={item.seller_id ? `/profile/${item.seller_id}` : '#'}
          className="flex items-center gap-3 py-4 border-t border-b border-slate-50 group mb-8"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center text-slate-400 font-bold text-base">
              {item.seller_photo
                ? <img src={item.seller_photo} className="w-full h-full object-cover" alt="Seller" />
                : item.seller_name?.[0] || 'S'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#FDFDFD]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Sold by</p>
            <p className="text-[14px] font-bold text-navy group-hover:text-accent transition-colors leading-none">
              {item.seller_name || 'Verified Student'}
            </p>
          </div>
          <ShieldCheck size={16} className="text-emerald-400" />
        </Link>

        {/* Safe bottom padding so content clears the fixed buy bar */}
        {/* Bottom nav ≈ 88px + buy bar ≈ 80px = 168px total */}
        <div className="h-[168px]" />
      </div>

      {/* ── FIXED BUY BAR ── 
           Positioned at bottom-[88px] to sit ABOVE the bottom nav (≈88px tall).
           Josh: bouncy spring on tap. Clear "Buy Now" CTA. Always visible. ── */}
      <div
        className="fixed left-0 right-0 z-[90] px-5 py-3 bg-[#FDFDFD]/95 backdrop-blur-xl border-t border-slate-100"
        style={{ bottom: '88px' }}
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97, y: 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          disabled={isOutOfStock || loading}
          onClick={() => setShowDeliverySheet(true)}
          className={`w-full h-[58px] rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 transition-all shadow-xl ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
              : 'bg-navy text-white shadow-navy/20 active:shadow-none'
          }`}
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            : isOutOfStock
            ? 'Out of Stock'
            : <><ShoppingBag size={20} /> Buy Now — RM {Number(item.price).toFixed(2)}</>
          }
        </motion.button>
      </div>

      {/* ── Marzia Delivery Sheet ── */}
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
