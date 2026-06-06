"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { resolveDispute } from '@/app/actions/adminActions';
import { Loader2, CheckCircle, FileText, X, AlertTriangle, Scale, ShieldAlert, BadgeCent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmDialog({ action, onClose, onConfirm, isWorking }: any) {
  let title = "";
  let description = "";

  if (action === 'REFUND') {
    title = "Issue Full Refund";
    description = "The Buyer will receive a 100% refund. The Seller will receive no payment and take a -5 Reputation hit. The escrow will be closed.";
  } else if (action === 'SPLIT') {
    title = "Split Funds (50/50)";
    description = "The Escrow funds will be split equally. 50% returned to the Buyer, 50% released to the Seller. The escrow will be closed.";
  } else if (action === 'PENALTY') {
    title = "Apply Runner Penalty";
    description = "The Buyer receives a full refund. The Runner will take a severe -10 Reputation hit for negligence. The escrow will be closed.";
  } else if (action === 'RELEASE') {
    title = "Dismiss & Pay Seller";
    description = "The dispute will be dismissed. The Seller will receive full payment and the Runner will receive their delivery fee. The escrow will be closed.";
  }

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full space-y-6">
        
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={isWorking}
            className="flex-1 h-11 rounded-xl text-[13px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(action)} disabled={isWorking}
            className={`flex-1 h-11 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center ${
              action === 'PENALTY' || action === 'REFUND' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Dispute Details Drawer ────────────────────────────────────────────────────
function DisputeDetailsDrawer({ dispute, onClose, onResolve }: { dispute: any; onClose: () => void; onResolve: (id: string, action: string) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!dispute) return null;

  const executeResolution = async (action: string) => {
    setIsWorking(true);
    await onResolve(dispute.id, action);
    setIsWorking(false);
    setConfirmAction(null);
    onClose();
  };

  return (
    <>
      {confirmAction && (
        <ConfirmDialog 
          action={confirmAction} 
          onClose={() => setConfirmAction(null)} 
          onConfirm={executeResolution} 
          isWorking={isWorking} 
        />
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white z-50 shadow-2xl flex flex-col">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Arbitration Dossier</p>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Case #{dispute.id.substring(0,8).toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Incident Report</h3>
            <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-red-400">Reported By</span>
                <span className="font-bold text-red-900">{dispute.reporter_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-red-400">Date Filed</span>
                <span className="font-bold text-red-900">{dispute.created_at?.toDate ? dispute.created_at.toDate().toLocaleString() : 'N/A'}</span>
              </div>
              <div className="pt-3 border-t border-red-200/50">
                <p className="text-[11px] font-bold text-red-400 mb-2">Stated Reason</p>
                <p className="text-[14px] font-medium text-red-900 leading-relaxed">"{dispute.reason || 'No reason provided.'}"</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Order Context</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Order ID</span>
                <span className="font-bold text-slate-900">#{dispute.order_id?.toUpperCase() || 'N/A'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls docked at bottom */}
        <div className="p-8 border-t border-slate-100 bg-white space-y-4">
          <h3 className="text-[12px] font-bold text-slate-900">Adjudication Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setConfirmAction('REFUND')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900">Full Refund</span>
            </button>
            <button onClick={() => setConfirmAction('SPLIT')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900">Split (50/50)</span>
            </button>
            <button onClick={() => setConfirmAction('PENALTY')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all group">
              <span className="text-[13px] font-bold text-red-700">Runner Penalty</span>
            </button>
            <button onClick={() => setConfirmAction('RELEASE')}
              className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 transition-all group shadow-md shadow-slate-900/10">
              <span className="text-[13px] font-bold text-white">Pay Seller</span>
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}

// ── Main Disputes Page ────────────────────────────────────────────────────────
export default function DisputesPage() {
  const [disputes,      setDisputes]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [viewingDispute, setViewingDispute] = useState<any>(null);

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

  const handleResolve = async (id: string, action: string) => {
    try {
      const res = await resolveDispute(id, action as any);
      if (!res.success) throw new Error(res.message);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      <AnimatePresence>
        {viewingDispute && (
          <DisputeDetailsDrawer dispute={viewingDispute} onClose={() => setViewingDispute(null)} onResolve={handleResolve} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Conflict Resolution</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Disputes</h1>
      </div>

      {/* Main List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Active Cases</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Review and resolve active buyer-seller conflicts.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {disputes.length} Open
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : disputes.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">All cases resolved</p>
            </div>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-100/50 transition-all">
                
                {/* Col 1-5: Issue details */}
                <div className="md:col-span-6 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <ShieldAlert size={16} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 line-clamp-1">{d.reason || 'No reason provided'}</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Dispute #{d.id.substring(0,8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Col 6-9: Reporter */}
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Reported By</p>
                  <p className="text-[13px] font-semibold text-slate-700">{d.reporter_name || '—'}</p>
                </div>

                {/* Col 10-12: Actions */}
                <div className="md:col-span-3 flex items-center justify-end">
                  <button onClick={() => setViewingDispute(d)}
                    className="h-10 px-6 rounded-xl text-[12px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                    Review Case
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
