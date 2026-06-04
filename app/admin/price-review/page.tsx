"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, getDoc
} from 'firebase/firestore';
import {
  ChevronLeft, ShieldCheck, ShieldAlert, ShieldX,
  Flag, CheckCircle2, X, Loader2, ImageOff,
  ChevronLeft as ChevronLeftImg, ChevronRight as ChevronRightImg,
  AlertTriangle, Inbox, TrendingUp
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

// ── TYPES ──────────────────────────────────────────────────────────────────────
type ReviewItem = {
  id: string;
  title: string;
  price: number;
  category: string;
  subcategory: string;
  images?: string[];
  image_url?: string;
  seller_id: string;
  seller_name: string;
  price_flag_count?: number;
  report_count?: number;
  is_price_flagged: boolean;
  price_justification?: string;
  price_appeal?: string;         // legacy field — same thing
  governance_ceiling?: number;
  flag_source?: string;
  status: string;
  created_at?: any;
};

// ── IMAGE GALLERY SUB-COMPONENT ────────────────────────────────────────────────
function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="w-full h-[220px] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-200">
        <ImageOff size={32} strokeWidth={1} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-slate-100 group">
        <img src={images[active]} alt="" className="w-full h-full object-cover transition-all duration-500" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => Math.max(0, i - 1))}
              disabled={active === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:opacity-20"
            >
              <ChevronLeftImg size={16} className="text-slate-700" />
            </button>
            <button
              onClick={() => setActive(i => Math.min(images.length - 1, i + 1))}
              disabled={active === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:opacity-20"
            >
              <ChevronRightImg size={16} className="text-slate-700" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1 rounded-full transition-all ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === active ? 'border-[#2A5C50] scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={img} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── REVIEW CARD ────────────────────────────────────────────────────────────────
function ReviewCard({
  item,
  onApprove,
  onReject,
  isProcessing,
}: {
  item: ReviewItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
}) {
  const images = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
  const reportCount = item.report_count ?? item.price_flag_count ?? 0;
  const justification = item.price_justification || item.price_appeal || null;
  const isSystemFlag = item.flag_source === 'SYSTEM';
  const ceiling = item.governance_ceiling;
  const overPct = ceiling && item.price > ceiling
    ? Math.round(((item.price - ceiling) / ceiling) * 100)
    : 0;
  const category = MARKETPLACE_CATEGORIES[item.category as CategoryID];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      {/* Top accent strip — pastel amber for community, pastel red for system */}
      <div className={`h-1 w-full ${isSystemFlag ? 'bg-red-300' : 'bg-amber-300'}`} />

      <div className="p-8 grid grid-cols-[260px_1fr_200px] gap-8 items-start">

        {/* ── COL 1: PHOTOS ── */}
        <div className="space-y-4">
          <ImageGallery images={images} />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {category.label}
                </span>
              )}
              {item.subcategory && (
                <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {item.subcategory}
                </span>
              )}
            </div>
            <h3 className="text-[17px] font-black text-slate-900 tracking-tight leading-snug">{item.title}</h3>
            <p className="text-[11px] font-medium text-slate-400">by {item.seller_name || 'Unknown seller'}</p>
          </div>
        </div>

        {/* ── COL 2: EVIDENCE PANEL ── */}
        <div className="space-y-5">

          {/* Flag source badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
              isSystemFlag
                ? 'bg-red-50 text-red-500 border-red-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {isSystemFlag ? <AlertTriangle size={11} /> : <Flag size={11} />}
              {isSystemFlag ? 'Auto-Flagged by System' : 'Community Report'}
            </span>
            {reportCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500">
                <Flag size={11} />
                {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
              </span>
            )}
          </div>

          {/* Price comparison card — pastel amber */}
          <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-100/80 space-y-4">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Price Analysis</p>
            <div className="flex items-end gap-8">
              <div>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Listed Price</p>
                <p className="text-[28px] font-black text-red-500 tracking-tighter">RM {Number(item.price).toFixed(2)}</p>
              </div>
              {ceiling && (
                <>
                  <div className="pb-1">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Campus Ceiling</p>
                    <p className="text-[22px] font-black text-slate-700 tracking-tighter">RM {Number(ceiling).toFixed(2)}</p>
                  </div>
                  {overPct > 0 && (
                    <div className="pb-1 flex items-end gap-1.5">
                      <TrendingUp size={16} className="text-red-400 mb-1.5" />
                      <div>
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Over By</p>
                        <p className="text-[22px] font-black text-red-400 tracking-tighter">+{overPct}%</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Visual bar */}
            {ceiling && (
              <div className="space-y-1.5">
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (item.price / (ceiling * 1.6)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-amber-400">
                  <span>RM 0</span>
                  <span>Ceiling: RM {ceiling}</span>
                </div>
              </div>
            )}
          </div>

          {/* Seller Justification card */}
          {justification ? (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Seller's Justification</p>
              <div className="flex gap-2.5">
                <div className="w-0.5 bg-[#2A5C50]/30 rounded-full shrink-0 mt-1" />
                <p className="text-[13px] font-semibold text-slate-700 leading-relaxed italic">
                  "{justification}"
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-1">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Seller's Justification</p>
              <p className="text-[12px] font-medium text-slate-300 italic">No justification provided by seller.</p>
            </div>
          )}
        </div>

        {/* ── COL 3: ACTIONS ── */}
        <div className="space-y-4 flex flex-col">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Admin Decision</p>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
              Approve to restore the listing. Reject to permanently remove it.
            </p>
          </div>

          {/* APPROVE */}
          <button
            onClick={() => onApprove(item.id)}
            disabled={isProcessing}
            className="w-full h-14 bg-[#2A5C50] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-[#234e45] active:scale-95 transition-all shadow-md shadow-[#2A5C50]/20 disabled:opacity-30"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Approve Listing
          </button>

          {/* REJECT */}
          <button
            onClick={() => onReject(item.id)}
            disabled={isProcessing}
            className="w-full h-14 bg-white text-red-500 border border-red-100 rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-30"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            Reject Fraudulent
          </button>

          {/* Item ID reference */}
          <p className="text-[9px] font-mono text-slate-200 text-center tracking-widest pt-1">
            #{item.id.substring(0, 12).toUpperCase()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function PriceReviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Auth guard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.data();
      if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
        router.push('/home');
      }
    });
    return () => unsub();
  }, [router]);

  // Real-time listener — all flagged items
  useEffect(() => {
    const q = query(collection(db, 'items'), where('is_price_flagged', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const flagged = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ReviewItem))
        .sort((a, b) => (b.report_count ?? b.price_flag_count ?? 0) - (a.report_count ?? a.price_flag_count ?? 0));
      setItems(flagged);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // APPROVE — sets status back to 'active', clears flag
  const handleApprove = async (itemId: string) => {
    setProcessing(itemId);
    try {
      await updateDoc(doc(db, 'items', itemId), {
        status: 'active',
        is_price_flagged: false,
        price_flag_count: 0,
        report_count: 0,
        flag_source: null,
        approved_by: auth.currentUser?.uid || 'ADMIN',
        approved_at: new Date(),
      });
      showToast('Listing approved and restored to marketplace.', 'ok');
    } catch (e) {
      console.error('[PriceReview] Approve failed:', e);
      showToast('Failed to approve. Please try again.', 'err');
    } finally {
      setProcessing(null);
    }
  };

  // REJECT — permanently removes listing from marketplace
  const handleReject = async (itemId: string) => {
    setProcessing(itemId);
    try {
      await updateDoc(doc(db, 'items', itemId), {
        status: 'REJECTED_FRAUDULENT',
        is_price_flagged: false,
        governance_rejected_by: auth.currentUser?.uid || 'ADMIN',
        governance_rejected_at: new Date(),
      });
      showToast('Listing rejected and removed from marketplace.', 'err');
    } catch (e) {
      console.error('[PriceReview] Reject failed:', e);
      showToast('Failed to reject. Please try again.', 'err');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] font-sans">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3.5 rounded-full shadow-lg flex items-center gap-3 text-[13px] font-bold text-white ${
              toast.type === 'ok' ? 'bg-[#2A5C50]' : 'bg-red-500'
            }`}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <X size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-[#E5E5EA] px-10 py-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-0.5">Market Governance</p>
            <h1 className="text-[22px] font-black text-[#1C1C1E] tracking-tight">Price Review Queue</h1>
          </div>
        </div>
        <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-2.5 ${
          items.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
        }`}>
          {items.length > 0
            ? <ShieldAlert size={14} className="text-red-500" />
            : <ShieldCheck size={14} className="text-emerald-500" />
          }
          <span className={`text-[11px] font-black uppercase tracking-widest ${
            items.length > 0 ? 'text-red-500' : 'text-emerald-600'
          }`}>
            {items.length > 0 ? `${items.length} Pending Review` : 'All Clear'}
          </span>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="max-w-[1300px] mx-auto px-10 py-10 space-y-6">
        {loading ? (
          <div className="py-40 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-200" />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-40 flex flex-col items-center gap-5 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
              <ShieldCheck size={36} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[16px] font-black text-slate-900 tracking-tight">All listings are compliant</p>
              <p className="text-[13px] font-medium text-slate-400">No flagged items require review right now.</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={processing === item.id}
              />
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
