"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { approveItem, holdForRevision, issueWarning, rejectItem, suspendSeller } from '@/app/actions/adminActions';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import {
  ShieldCheck, ShieldAlert, Flag, CheckCircle2, X,
  Loader2, AlertTriangle, TrendingUp, AlertCircle,
  PauseCircle, ChevronDown, Ban, ImageOff
} from 'lucide-react';

const CAMPUS_DEFAULTS: Record<string, number> = {
  HUNGER: 25, ACADEMIC: 200, HOSTEL: 500, TECH: 3500, APPAREL: 300,
};

// ── Revision Reason Templates ─────────────────────────────────────────────────
type ReasonKey = 'PRICE_TOO_HIGH' | 'MISLEADING_DESCRIPTION' | 'INSUFFICIENT_IMAGES' | 'PROHIBITED_ITEM' | 'DUPLICATE_LISTING';

const REVISION_REASONS: { key: ReasonKey; label: string }[] = [
  { key: 'PRICE_TOO_HIGH',          label: 'Price exceeds campus ceiling' },
  { key: 'MISLEADING_DESCRIPTION',  label: 'Misleading item description' },
  { key: 'INSUFFICIENT_IMAGES',     label: 'Insufficient images provided' },
  { key: 'PROHIBITED_ITEM',         label: 'Prohibited item category' },
  { key: 'DUPLICATE_LISTING',       label: 'Duplicate listing detected' },
];

function buildTemplate(key: ReasonKey, item: any, ceiling: number): string {
  const cat = MARKETPLACE_CATEGORIES[item.category as CategoryID]?.label || item.category;
  switch (key) {
    case 'PRICE_TOO_HIGH':
      return `Your listing "${item.title}" (RM ${Number(item.price).toFixed(2)}) has been temporarily held because it exceeds the campus ${cat} category ceiling of RM ${ceiling.toFixed(2)}. Please revise the price to RM ${ceiling.toFixed(2)} or below and resubmit for review.`;
    case 'MISLEADING_DESCRIPTION':
      return `Your listing "${item.title}" has been temporarily held because the item description appears to be misleading or inaccurate. Please update your description to accurately reflect the item's condition and resubmit.`;
    case 'INSUFFICIENT_IMAGES':
      return `Your listing "${item.title}" has been temporarily held because it does not have sufficient images for buyers to make an informed decision. Please add at least 2 clear photos and resubmit.`;
    case 'PROHIBITED_ITEM':
      return `Your listing "${item.title}" has been temporarily held as it may fall under a prohibited item category on the Pulse marketplace. Please review our listing guidelines before resubmitting.`;
    case 'DUPLICATE_LISTING':
      return `Your listing "${item.title}" has been temporarily held as it appears to be a duplicate of an existing listing. Please remove the duplicate and maintain only one active listing for this item.`;
    default:
      return '';
  }
}

// ── Hold for Revision Drawer ──────────────────────────────────────────────────
function RevisionDrawer({ item, ceiling, onClose, onSubmit, isProcessing }: {
  item: any; ceiling: number; onClose: () => void;
  onSubmit: (reason: ReasonKey, message: string) => void; isProcessing: boolean;
}) {
  const [reason,     setReason]     = useState<ReasonKey>('PRICE_TOO_HIGH');
  const [customNote, setCustomNote] = useState('');
  const baseMessage = buildTemplate(reason, item, ceiling);
  const finalMessage = customNote.trim() ? `${baseMessage}\n\nAdmin note: ${customNote.trim()}` : baseMessage;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[480px] bg-white z-50 shadow-2xl flex flex-col">

        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PauseCircle size={18} className="text-amber-500" />
              <h2 className="text-[18px] font-semibold text-slate-900">Hold for Revision</h2>
            </div>
            <p className="text-[12px] text-slate-400">Item will be hidden until seller revises it</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Item preview */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
              {item.images?.[0] || item.image_url
                ? <img src={item.images?.[0] || item.image_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center"><ImageOff size={16} className="text-slate-300" /></div>}
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900 leading-tight">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">RM {Number(item.price).toFixed(2)} · {item.seller_name}</p>
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400  block mb-2">Reason</label>
            <div className="space-y-2">
              {REVISION_REASONS.map(r => (
                <button key={r.key} onClick={() => setReason(r.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    reason === r.key
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200'
                  }`}>
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${reason === r.key ? 'border-white bg-white' : 'border-slate-300'}`} />
                  <span className="text-[13px] font-semibold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-generated message preview */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400  block mb-2">Notification Preview</label>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[13px] font-medium text-amber-900 leading-relaxed">{baseMessage}</p>
            </div>
          </div>

          {/* Optional custom note */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400  block mb-2">
              Additional Note <span className="text-slate-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={customNote} onChange={e => setCustomNote(e.target.value)}
              rows={3} placeholder="Add a specific instruction for this seller..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all resize-none placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100">
          <button onClick={() => onSubmit(reason, finalMessage)} disabled={isProcessing}
            className="w-full h-12 bg-amber-500 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-50">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <PauseCircle size={16} />}
            Hold & Send Notice
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Action Menu ───────────────────────────────────────────────────────────────
function ActionMenu({ item, ceiling, onAction }: {
  item: any; ceiling: number;
  onAction: (type: 'hold' | 'warn' | 'reject' | 'suspend') => void;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    { id: 'hold',    label: 'Hold for Revision',  icon: PauseCircle,   color: 'text-amber-600',  desc: 'Hide & notify seller to fix' },
    { id: 'warn',    label: 'Issue Warning',       icon: AlertCircle,   color: 'text-orange-600', desc: `Strike ${(item.strike_count ?? 0) + 1} of 3` },
    { id: 'reject',  label: 'Reject & Remove',     icon: X,             color: 'text-red-600',    desc: 'Remove to vault' },
    { id: 'suspend', label: 'Suspend Seller',      icon: Ban,           color: 'text-red-900',    desc: 'Remove item + revoke merchant access' },
  ] as const;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-full h-12 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]">
        <ShieldAlert size={15} /> Governance Actions
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/10 overflow-hidden z-50">
              {actions.map(a => (
                <button key={a.id} onClick={() => { setOpen(false); onAction(a.id); }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left">
                  <a.icon size={18} className={a.color} />
                  <div>
                    <p className={`text-[13px] font-bold ${a.color}`}>{a.label}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{a.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ item, onAction }: { item: any; onAction: (type: string, item: any) => void }) {
  const ceiling    = item.governance_ceiling ?? CAMPUS_DEFAULTS[item.category] ?? 0;
  const overPct    = ceiling && item.price > ceiling ? Math.round(((item.price - ceiling) / ceiling) * 100) : 0;
  const catConfig  = MARKETPLACE_CATEGORIES[item.category as CategoryID];
  const images     = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
  const strikes    = item.strike_count ?? 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm relative">

      {/* Header strip */}
      <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold  ${
            item.flag_source === 'SYSTEM' ? 'bg-rose-50/80 text-rose-500 border border-rose-100/50' : 'bg-amber-50/80 text-amber-600 border border-amber-100/50'
          }`}>
            {item.flag_source === 'SYSTEM' ? <AlertTriangle size={12} strokeWidth={2.5} /> : <Flag size={12} strokeWidth={2.5} />}
            {item.flag_source === 'SYSTEM' ? 'System Flagged' : `${item.report_count ?? 0} Community Reports`}
          </span>
          {strikes > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold  bg-slate-100/80 text-slate-500 border border-slate-200/50">
              <AlertCircle size={12} strokeWidth={2.5} /> Strike {strikes}/3
            </span>
          )}
        </div>
        <code className="text-[10px] font-mono text-slate-300">#{item.id.substring(0,8).toUpperCase()}</code>
      </div>

      <div className="p-6 grid grid-cols-12 gap-6 items-start">
        {/* Image */}
        <div className="col-span-2">
          <div className="aspect-square w-full rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
            {images.length > 0
              ? <img src={images[0]} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center"><ImageOff size={20} className="text-slate-300" /></div>}
          </div>
        </div>

        {/* Info */}
        <div className="col-span-5 space-y-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{item.title}</h3>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">by {item.seller_name}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md ">
              {catConfig?.label || item.category}
            </span>
            {item.subcategory && <span className="text-[9px] font-medium text-slate-400 py-1">· {item.subcategory}</span>}
          </div>
          {item.price_justification && (
            <div className="border-l-2 border-slate-200 pl-3">
              <p className="text-[11px] text-slate-400 italic">"{item.price_justification}"</p>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="col-span-2 space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 ">Listed</p>
          <p className="text-[22px] font-semibold text-red-500 leading-none">RM {Number(item.price).toFixed(2)}</p>
          {ceiling > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-400  mt-2">Ceiling</p>
              <p className="text-[15px] font-bold text-slate-700">RM {Number(ceiling).toFixed(2)}</p>
              {overPct > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500">
                  <TrendingUp size={12} /> +{overPct}% over
                </span>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-3 space-y-2">
          <button onClick={() => onAction('approve', item)}
            className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-[0.98]">
            <CheckCircle2 size={15} /> Approve
          </button>
          <ActionMenu item={item} ceiling={ceiling} onAction={(type) => onAction(type, item)} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'warn' }) {
  return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 px-6 py-3 rounded-full shadow-lg text-white text-[13px] font-bold flex items-center gap-2 ${
        type === 'ok' ? 'bg-slate-900' : type === 'warn' ? 'bg-orange-500' : 'bg-red-500'
      }`}>
      {type === 'ok' ? <CheckCircle2 size={16} /> : type === 'warn' ? <AlertCircle size={16} /> : <X size={16} />}
      {msg}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const DUMMY = [
  { id: 'dummy-1', title: 'Sony WH-1000XM4 Headphones', price: 950, category: 'TECH', subcategory: 'Devices',
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80'],
    seller_id: 's1', seller_name: 'Azfar Electronics', report_count: 5, is_price_flagged: true,
    price_justification: 'Imported directly. Full warranty. Regular price RM 1,200.',
    governance_ceiling: 500, flag_source: 'COMMUNITY', status: 'active', strike_count: 1 },
  { id: 'dummy-2', title: 'Calculus 9th Ed. Hardcover', price: 150, category: 'ACADEMIC', subcategory: 'Textbooks',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80'],
    seller_id: 's2', seller_name: 'Sarah Lee', report_count: 0, is_price_flagged: true,
    price_justification: 'Rare hardcover in pristine condition.', governance_ceiling: 80, flag_source: 'SYSTEM', status: 'active', strike_count: 0 },
];

export default function PriceReviewPage() {
  const [items,       setItems]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null);
  const [holdItem,    setHoldItem]    = useState<any>(null);

  const adminId = auth.currentUser?.uid || 'ADMIN';

  useEffect(() => {
    const q = query(collection(db, 'items'), where('is_price_flagged', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      let flagged = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.report_count ?? 0) - (a.report_count ?? 0));
      if (flagged.length === 0) flagged = DUMMY;
      setItems(flagged);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err' | 'warn') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isDummy = (id: string) => id.startsWith('dummy-');

  const handleAction = async (type: string, item: any) => {
    if (type === 'hold') { setHoldItem(item); return; }
    setProcessing(item.id);

    try {
      if (isDummy(item.id)) {
        setItems(p => p.filter(i => i.id !== item.id));
        showToast(type === 'approve' ? 'Listing approved.' : 'Action applied.', 'ok');
        return;
      }
      let res: any;
      if (type === 'approve')  res = await approveItem(item.id, adminId);
      if (type === 'warn')     res = await issueWarning(item.id, item.seller_id, adminId, item.title);
      if (type === 'reject')   res = await rejectItem(item.id, item.seller_id, adminId);
      if (type === 'suspend')  res = await suspendSeller(item.id, item.seller_id, adminId);

      if (res?.success) {
        const messages: Record<string, { msg: string; type: 'ok' | 'err' | 'warn' }> = {
          approve:  { msg: 'Listing approved and live.',            type: 'ok' },
          warn:     { msg: res.autoSuspended ? `Strike 3 — Seller auto-suspended.` : `Warning issued (Strike ${res.strikes}/3).`, type: 'warn' },
          reject:   { msg: 'Listing rejected and moved to Vault.',  type: 'err' },
          suspend:  { msg: 'Seller suspended. Listing removed.',    type: 'err' },
        };
        const t = messages[type];
        if (t) showToast(t.msg, t.type);
      } else {
        showToast(res?.message || 'Something went wrong.', 'err');
      }
    } catch { showToast('Action failed. Try again.', 'err'); }
    finally   { setProcessing(null); }
  };

  const handleHoldSubmit = async (reason: ReasonKey, message: string) => {
    if (!holdItem) return;
    setProcessing(holdItem.id);
    try {
      if (!isDummy(holdItem.id)) {
        const res = await holdForRevision(holdItem.id, holdItem.seller_id, adminId, reason, message);
        if (!res.success) { showToast(res.message || 'Failed.', 'err'); return; }
      } else {
        setItems(p => p.filter(i => i.id !== holdItem.id));
      }
      showToast('Listing held. Seller has been notified.', 'warn');
    } catch { showToast('Failed to hold listing.', 'err'); }
    finally { setProcessing(null); setHoldItem(null); }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <AnimatePresence>{toast && <Toast {...toast} />}</AnimatePresence>
      <AnimatePresence>
        {holdItem && (
          <RevisionDrawer item={holdItem}
            ceiling={holdItem.governance_ceiling ?? CAMPUS_DEFAULTS[holdItem.category] ?? 0}
            onClose={() => setHoldItem(null)}
            onSubmit={handleHoldSubmit}
            isProcessing={!!processing} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400  mb-1">Market Governance</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Price Review</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            Use Governance Actions for granular control over each flagged listing.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
          items.length > 0 ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
        }`}>
          {items.length > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          <span className="text-[12px] font-bold">{items.length > 0 ? `${items.length} pending` : 'All clear'}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-[11px] font-semibold text-slate-400">
        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> Approve — restore to marketplace</span>
        <span className="flex items-center gap-1.5"><PauseCircle size={13} className="text-amber-500" /> Hold — hide & send templated notice</span>
        <span className="flex items-center gap-1.5"><AlertCircle size={13} className="text-orange-500" /> Warning — add strike (auto-suspend at 3)</span>
        <span className="flex items-center gap-1.5"><Ban size={13} className="text-red-500" /> Suspend — remove item + revoke access</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-32 flex items-center justify-center"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
      ) : items.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={28} className="text-emerald-500" />
          </div>
          <p className="text-[16px] font-bold text-slate-400">All listings are compliant</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <ReviewCard key={item.id} item={item}
              onAction={(type, i) => handleAction(type, i ?? item)} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
