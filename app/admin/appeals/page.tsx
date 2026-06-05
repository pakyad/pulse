"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Inbox, CheckCircle, X, Loader2 } from 'lucide-react';

export default function AppealsPage() {
  const [appeals,      setAppeals]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [processing,   setProcessing]   = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'appeals'), where('status', '==', 'PENDING'));
    const unsub = onSnapshot(q, (snap) => {
      setAppeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdjudicate = async (appeal: any, action: 'APPROVE' | 'REJECT') => {
    setProcessing(appeal.id);
    try {
      // If APPROVE — restore item to active and clear flags
      if (action === 'APPROVE') {
        await updateDoc(doc(db, 'items', appeal.itemId), {
          status: 'active',
          is_price_flagged: false,
          price_flag_count: 0,
          report_count: 0,
          flag_source: null,
          appeal_approved_by: auth.currentUser?.uid || 'ADMIN',
          appeal_approved_at: new Date(),
        });
        await updateDoc(doc(db, 'appeals', appeal.id), { status: 'APPROVED' });
        showToast('Appeal approved. Listing is back on the marketplace.', 'ok');
      } else {
        // REJECT — push to REJECTED_FRAUDULENT
        await updateDoc(doc(db, 'items', appeal.itemId), {
          status: 'REJECTED_FRAUDULENT',
          is_price_flagged: false,
          governance_rejected_by: auth.currentUser?.uid || 'ADMIN',
          governance_rejected_at: new Date(),
        });
        await updateDoc(doc(db, 'appeals', appeal.id), { status: 'REJECTED' });
        showToast('Appeal rejected. Listing removed from marketplace.', 'err');
      }
    } catch (e) {
      console.error('[Appeals] Adjudication failed:', e);
      showToast('Something went wrong. Please try again.', 'err');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 text-[13px] font-bold text-white ${
              toast.type === 'ok' ? 'bg-slate-900' : 'bg-red-500'
            }`}>
            {toast.type === 'ok' ? <CheckCircle size={16} /> : <X size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400  mb-1">Seller Requests</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Price Appeals</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            Sellers requesting an exemption above the campus price limit.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 ">{appeals.length} pending</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-32 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : appeals.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-400">No pending appeals</p>
            <p className="text-[12px] text-slate-300 mt-1">Sellers have not submitted any price exemption requests.</p>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          {appeals.map((appeal) => (
            <motion.div key={appeal.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col lg:flex-row gap-8 items-start">

              {/* Left info */}
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <ShieldAlert size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{appeal.itemTitle || 'Unnamed Item'}</p>
                    <p className="text-[11px] font-bold text-slate-400  mt-0.5">
                      Seller: {appeal.sellerName || '—'}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 ">Seller's Reason</p>
                  <p className="text-[13px] font-medium text-slate-600 italic leading-relaxed">
                    "{appeal.justification_text || 'No reason provided.'}"
                  </p>
                </div>
              </div>

              {/* Right actions */}
              <div className="w-full lg:w-[280px] space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 ">Asking Price</span>
                    <span className="text-[16px] font-semibold text-slate-900">RM {Number(appeal.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 ">Category</span>
                    <span className="text-[12px] font-bold text-slate-900">{appeal.category || '—'}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleAdjudicate(appeal, 'APPROVE')} disabled={processing === appeal.id}
                    className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold text-[12px]  hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40">
                    {processing === appeal.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                  <button onClick={() => handleAdjudicate(appeal, 'REJECT')} disabled={processing === appeal.id}
                    className="flex-1 h-12 bg-white text-red-600 border border-red-100 rounded-xl font-bold text-[12px]  hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40">
                    {processing === appeal.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
