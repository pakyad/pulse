"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { resolveDispute } from '@/app/actions/adminActions';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ChevronRight, Inbox, Loader2, X, CheckCircle, DollarSign } from 'lucide-react';

// ── Dispute Drawer ─────────────────────────────────────────────────────────────
function DisputeDrawer({ dispute, onClose, onResolve, isProcessing }: {
  dispute: any; onClose: () => void;
  onResolve: (id: string, action: 'REFUND' | 'RELEASE') => void; isProcessing: boolean;
}) {
  if (!dispute) return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[480px] bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-slate-400  mb-1">Dispute #{dispute.id.substring(0, 8).toUpperCase()}</p>
            <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">Review Case</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400  mb-1">Issue</p>
              <p className="text-[15px] font-bold text-slate-900">{dispute.reason || 'No reason provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400  mb-1">Reported by</p>
                <p className="text-[13px] font-bold text-slate-900">{dispute.reporter_name || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400  mb-1">Filed</p>
                <p className="text-[13px] font-bold text-slate-900">
                  {dispute.created_at?.toDate ? dispute.created_at.toDate().toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-[11px] font-bold text-amber-700">Choose a resolution below. This action cannot be undone.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-slate-100 space-y-3">
          <button onClick={() => onResolve(dispute.id, 'REFUND')} disabled={isProcessing}
            className="w-full h-13 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
            Refund Buyer
          </button>
          <button onClick={() => onResolve(dispute.id, 'RELEASE')} disabled={isProcessing}
            className="w-full h-13 bg-slate-900 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-[0.98] disabled:opacity-50">
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Release to Seller
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function DisputesPage() {
  const [disputes,      setDisputes]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState<any>(null);
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'disputes'), where('status', '==', 'AWAITING_ADMIN'));
    const unsub = onSnapshot(q, (snap) => {
      setDisputes(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => b.created_at?.toMillis?.() - a.created_at?.toMillis?.())
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleResolve = async (id: string, action: 'REFUND' | 'RELEASE') => {
    setIsProcessing(true);
    try {
      const res = await resolveDispute(id, action);
      if (res.success) {
        setSelected(null);
        setToast(action === 'RELEASE' ? 'Funds released to seller.' : 'Buyer has been refunded.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch { /* handled by server action */ }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg bg-slate-900 text-white text-[13px] font-bold flex items-center gap-2">
            <CheckCircle size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <DisputeDrawer dispute={selected} onClose={() => setSelected(null)}
            onResolve={handleResolve} isProcessing={isProcessing} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400  mb-1">Conflict Resolution</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Disputes</h1>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 ">{disputes.length} open</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-32 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-400">No open disputes</p>
            <p className="text-[12px] text-slate-300 mt-1">All cases have been resolved.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <button key={d.id} onClick={() => setSelected(d)}
              className="w-full bg-white rounded-2xl border border-slate-100 p-6 text-left hover:shadow-md hover:shadow-slate-100 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-slate-300 ">#{d.id.substring(0,8).toUpperCase()}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-semibold text-red-500 uppercase">Awaiting Review</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900">{d.reason || 'Dispute filed'}</h3>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400  mb-0.5">Reported by</p>
                  <p className="text-[12px] font-bold text-slate-900">{d.reporter_name || '—'}</p>
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
