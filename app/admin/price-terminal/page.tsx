"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { updatePriceGuideline } from '@/app/actions/adminActions';
import { ShieldAlert, Plus, X, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

// ── Campus-level default ceilings (used if no Firestore guideline exists) ─────
const CAMPUS_DEFAULTS: Record<string, number> = {
  HUNGER:   25,
  ACADEMIC: 200,
  HOSTEL:   500,
  TECH:     3500,
  APPAREL:  300,
};

// ── Policy Modal ───────────────────────────────────────────────────────────────
function PolicyModal({ onClose, onSave }: { onClose: () => void; onSave: (cat: string, price: number, type: 'REGULATED' | 'PREMIUM') => Promise<void> }) {
  const [category, setCategory]           = useState<CategoryID>('TECH');
  const [price,    setPrice]              = useState('');
  const [type,     setType]               = useState<'REGULATED' | 'PREMIUM'>('REGULATED');
  const [saving,   setSaving]             = useState(false);

  const handle = async () => {
    if (!price || isNaN(Number(price))) return;
    setSaving(true);
    await onSave(category, Number(price), type);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Set Price Limit</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Write a new ceiling to Firestore</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex p-1 bg-slate-50 rounded-xl gap-1">
          {(['REGULATED', 'PREMIUM'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all ${
                type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              }`}>
              {t === 'REGULATED' ? 'Hard Limit' : 'Soft Limit'}
            </button>
          ))}
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as CategoryID)}
            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all">
            {Object.values(MARKETPLACE_CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Price Ceiling (RM) — Current default: RM {CAMPUS_DEFAULTS[category] ?? '–'}
          </label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder={`e.g. ${CAMPUS_DEFAULTS[category]}`}
            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all placeholder:text-slate-300" />
        </div>

        <button onClick={handle} disabled={!price || saving}
          className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Save Limit
        </button>
      </motion.div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PriceTerminalPage() {
  const router     = useRouter();
  const [items,      setItems]      = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<Record<string, any>>({});
  const [showModal,  setShowModal]  = useState(false);

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'items'),
      (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubGuides = onSnapshot(collection(db, 'PriceGuidelines'),
      (snap) => {
        const g: Record<string, any> = {};
        snap.docs.forEach(d => { g[d.id.toUpperCase()] = { id: d.id, ...d.data() }; });
        setGuidelines(g);
      }
    );
    return () => { unsubItems(); unsubGuides(); };
  }, []);

  // Category-level averages for spike detection
  const categoryStats: Record<string, { total: number; count: number }> = {};
  items.forEach(i => {
    if (!i.category) return;
    if (!categoryStats[i.category]) categoryStats[i.category] = { total: 0, count: 0 };
    categoryStats[i.category].total += Number(i.price || 0);
    categoryStats[i.category].count += 1;
  });
  const categoryAvg: Record<string, number> = {};
  Object.keys(categoryStats).forEach(cat => {
    categoryAvg[cat] = categoryStats[cat].total / categoryStats[cat].count;
  });

  // Flagging logic — ceiling from Firestore OR campus defaults
  const flagged = items.filter(i => {
    const guide   = guidelines[i.category];
    const ceiling = guide?.max_price ?? CAMPUS_DEFAULTS[i.category] ?? 9999;
    const avg     = categoryAvg[i.category] ?? i.price;
    return i.price > ceiling || (i.price > avg * 1.5 && i.price > 10);
  });

  const activeGuidelines = Object.values(guidelines).filter(g => g.category && !isNaN(Number(g.max_price)));

  const handleSavePolicy = async (cat: string, price: number, type: 'REGULATED' | 'PREMIUM') => {
    await updatePriceGuideline(cat, price, type);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <AnimatePresence>
        {showModal && <PolicyModal onClose={() => setShowModal(false)} onSave={handleSavePolicy} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Economic Oversight</p>
          <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Price Audit</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="h-10 px-5 bg-slate-900 text-white rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center gap-2">
          <Plus size={15} /> Set Limit
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Flagged Items</p>
          <p className="text-[32px] font-black text-slate-900 leading-none">{flagged.length}</p>
        </div>
        <div className="w-px bg-slate-100" />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Limits</p>
          <p className="text-[32px] font-black text-slate-900 leading-none">{activeGuidelines.length}</p>
        </div>
        <div className="w-px bg-slate-100" />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Campus Defaults</p>
          <p className="text-[32px] font-black text-slate-900 leading-none">{Object.keys(CAMPUS_DEFAULTS).length}</p>
        </div>
      </div>

      {/* Active Limits */}
      {activeGuidelines.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Saved Limits</p>
          </div>
          <div className="divide-y divide-slate-50">
            {activeGuidelines.map((g: any) => (
              <div key={g.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{g.category}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {g.governance_type === 'PREMIUM' ? 'Soft Limit' : 'Hard Limit'}
                  </p>
                </div>
                <p className="text-[18px] font-black text-slate-900">RM {Number(g.max_price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Items Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Flagged Items</p>
          {flagged.length > 0 && (
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              {flagged.length} need review
            </span>
          )}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/50 border-b border-slate-100">
          <div className="col-span-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item & Seller</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Listed Price</div>
          <div className="col-span-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ceiling</div>
          <div className="col-span-1" />
        </div>

        {flagged.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400">
              <CheckCircle size={22} />
            </div>
            <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">All items are within limits</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {flagged.map((item) => {
              const guide   = guidelines[item.category];
              const ceiling = guide?.max_price ?? CAMPUS_DEFAULTS[item.category] ?? 0;
              const isSpike = !item.price || item.price > (categoryAvg[item.category] ?? 0) * 1.5;
              return (
                <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                  <div className="col-span-5">
                    <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">{item.seller_name || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[14px] font-black text-red-500">RM {Number(item.price).toFixed(2)}</p>
                    {isSpike && <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Price spike</p>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[14px] font-bold text-slate-500">
                      RM {ceiling > 0 ? Number(ceiling).toFixed(2) : `${CAMPUS_DEFAULTS[item.category] ?? '–'}`}
                    </p>
                    {!guide && (
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Default</p>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => router.push(`/admin/price-review`)}
                      className="h-8 px-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95">
                      Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
