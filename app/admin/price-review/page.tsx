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
  ChevronLeft, ShieldCheck, ShieldAlert,
  Flag, CheckCircle2, X, Loader2, ImageOff,
  AlertTriangle, TrendingUp
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
  price_appeal?: string;
  governance_ceiling?: number;
  flag_source?: string;
  status: string;
  created_at?: any;
};

// ── DUMMY DATA ─────────────────────────────────────────────────────────────────
const DUMMY_DATA: ReviewItem[] = [
  {
    id: "dummy-1",
    title: "Sony WH-1000XM4 Headphones (Brand New)",
    price: 950,
    category: "TECH",
    subcategory: "Devices",
    images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400"],
    seller_id: "seller-1",
    seller_name: "Azfar Electronics",
    price_flag_count: 5,
    report_count: 5,
    is_price_flagged: true,
    price_justification: "Imported directly from official Sony distributor. Full warranty included. Regular price is RM 1,200.",
    governance_ceiling: 500,
    flag_source: "COMMUNITY",
    status: "active"
  },
  {
    id: "dummy-2",
    title: "Calculus Early Transcendentals 9th Edition",
    price: 150,
    category: "ACADEMIC",
    subcategory: "Textbooks",
    images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400"],
    seller_id: "seller-2",
    seller_name: "Sarah Lee",
    report_count: 0,
    is_price_flagged: true,
    price_justification: "This is a rare hardcover edition in pristine condition. Usually goes for RM200+.",
    governance_ceiling: 80,
    flag_source: "SYSTEM",
    status: "active"
  },
  {
    id: "dummy-3",
    title: "Mini Fridge 50L (Used 1 Sem)",
    price: 250,
    category: "HOSTEL",
    subcategory: "Appliances",
    images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&q=80&w=400"],
    seller_id: "seller-3",
    seller_name: "Ahmad Kamal",
    report_count: 12,
    is_price_flagged: true,
    price_justification: "",
    governance_ceiling: 150,
    flag_source: "COMMUNITY",
    status: "active"
  }
];

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
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
              isSystemFlag
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {isSystemFlag ? <AlertTriangle size={12} /> : <Flag size={12} />}
              {isSystemFlag ? 'System Flagged' : 'Community Reported'}
          </span>
          {reportCount > 0 && (
             <span className="text-[12px] font-semibold text-slate-500">
               {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
             </span>
          )}
        </div>
        <p className="text-[11px] font-mono font-medium text-slate-400">ID: {item.id.substring(0, 8).toUpperCase()}</p>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Image & Info */}
        <div className="w-full lg:w-[40%] space-y-5">
           <div className="flex gap-5">
             {/* Thumbnail */}
             <div className="w-24 h-24 rounded-xl border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
               {images.length > 0 ? (
                 <img src={images[0]} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageOff size={24} /></div>
               )}
             </div>
             <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug">{item.title}</h3>
                <p className="text-[13px] font-medium text-slate-500 mt-1">by {item.seller_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
                    {category?.label || item.category}
                  </span>
                  {item.subcategory && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      • {item.subcategory}
                    </span>
                  )}
                </div>
             </div>
           </div>
           
           {/* Justification */}
           <div className="space-y-2">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Seller's Justification</p>
             {justification ? (
               <div className="border-l-2 border-slate-200 pl-4 py-1">
                 <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed">"{justification}"</p>
               </div>
             ) : (
               <p className="text-[13px] font-medium text-slate-400 italic">No justification provided.</p>
             )}
           </div>
        </div>

        {/* Center: Price Details */}
        <div className="w-full lg:w-[30%] space-y-4">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Price Analysis</p>
           <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-500">Listed Price</span>
                <span className="text-[20px] font-black text-red-500">RM {Number(item.price).toFixed(2)}</span>
             </div>
             {ceiling && (
               <>
                 <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-[13px] font-medium text-slate-500">Campus Ceiling</span>
                    <span className="text-[15px] font-bold text-slate-900">RM {Number(ceiling).toFixed(2)}</span>
                 </div>
                 {overPct > 0 && (
                   <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-slate-500">Exceeds By</span>
                      <span className="text-[14px] font-bold text-red-500 flex items-center gap-1">
                        <TrendingUp size={14} /> +{overPct}%
                      </span>
                   </div>
                 )}
               </>
             )}
           </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full lg:w-[30%] flex flex-col gap-3">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:text-right hidden lg:block">Action</p>
           <button
            onClick={() => onApprove(item.id)}
            disabled={isProcessing}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
           >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Approve Listing
           </button>
           <button
            onClick={() => onReject(item.id)}
            disabled={isProcessing}
            className="w-full h-12 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50"
           >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            Reject & Remove
           </button>
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
      let flagged = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ReviewItem))
        .sort((a, b) => (b.report_count ?? b.price_flag_count ?? 0) - (a.report_count ?? a.price_flag_count ?? 0));
      
      // Inject dummy data if empty
      if (flagged.length === 0) {
        flagged = DUMMY_DATA;
      }
      
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
    if (itemId.startsWith('dummy-')) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Dummy listing approved.', 'ok');
      return;
    }
    
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
    if (itemId.startsWith('dummy-')) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Dummy listing rejected.', 'err');
      return;
    }
    
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
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-lg flex items-center gap-3 text-[13px] font-bold text-white ${
              toast.type === 'ok' ? 'bg-[#2A5C50]' : 'bg-red-500'
            }`}
          >
            {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <X size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Price Review Queue</h1>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Market Governance</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
          items.length > 0 ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
        }`}>
          {items.length > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          <span className="text-[12px] font-bold">
            {items.length > 0 ? `${items.length} Pending Review` : 'All Clear'}
          </span>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {loading ? (
          <div className="py-32 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={32} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[16px] font-bold text-slate-900">All listings are compliant</p>
              <p className="text-[13px] text-slate-500">No flagged items require review right now.</p>
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
