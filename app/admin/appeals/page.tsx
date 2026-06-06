"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { resolveAppeal } from '@/app/actions/adminActions';
import { CheckCircle, Loader2, X, ImageOff, MessageSquare, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmDialog({ action, onClose, onConfirm, isWorking }: any) {
  let title = action === 'APPROVE' ? "Approve Appeal" : "Reject Appeal";
  let description = action === 'APPROVE' 
    ? "This will override the campus price limits. The item will become Active and visible to all buyers on the marketplace."
    : "This will permanently reject the appeal. The item will be marked as violating policy and removed from the marketplace.";

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
              action === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Item Details Drawer (for Appeals) ─────────────────────────────────────────
function AppealDetailsDrawer({ appeal, item, onClose, onResolve }: { appeal: any; item: any; onClose: () => void; onResolve: (appeal: any, action: string) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!appeal) return null;
  const images = item?.images?.length ? item.images : item?.image_url ? [item.image_url] : [];
  const catConfig = MARKETPLACE_CATEGORIES[item?.category as CategoryID];

  const executeResolution = async (action: string) => {
    setIsWorking(true);
    await onResolve(appeal, action);
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
        className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Dossier</p>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Appeal Details</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Seller's Justification</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                "{appeal.justification_text || 'No justification provided.'}"
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Product Information</h3>
            <div className="p-5 bg-white shadow-sm rounded-2xl border border-slate-100 space-y-4">
              {images.length > 0 ? (
                <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden">
                  <img src={images[0]} className="w-full h-full object-cover" alt="Item" />
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <ImageOff size={20} className="text-slate-300" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Title</p>
                <p className="text-[14px] font-bold text-slate-900">{appeal.itemTitle || item?.title || 'Unknown'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Category</p>
                  <p className="text-[13px] font-semibold text-slate-700">{catConfig?.label || item?.category || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Asking Price</p>
                  <p className="text-[13px] font-bold text-slate-900">RM {Number(appeal.price || item?.price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls docked at bottom */}
        <div className="p-8 border-t border-slate-100 bg-white space-y-4">
          <h3 className="text-[12px] font-bold text-slate-900">Adjudication Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setConfirmAction('REJECT')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-red-700">Reject</span>
            </button>
            <button onClick={() => setConfirmAction('APPROVE')}
              className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 transition-all group shadow-md shadow-slate-900/10">
              <span className="text-[13px] font-bold text-white">Approve Override</span>
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AppealsPage() {
  const [appeals,      setAppeals]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  
  const [viewingAppeal, setViewingAppeal] = useState<any>(null);
  const [viewingItemData, setViewingItemData] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'appeals'), where('status', '==', 'PENDING'));
    const unsub = onSnapshot(q, (snap) => {
      setAppeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleResolve = async (appeal: any, action: string) => {
    try {
      const adminId = auth.currentUser?.uid || 'ADMIN';
      const res = await resolveAppeal(appeal.id, appeal.itemId, adminId, action as any);
      if (!res.success) {
        alert(res.message || 'Failed to process appeal.');
      }
    } catch (e) {
      console.error('[Appeals] failed:', e);
      alert('Failed to process appeal.');
    }
  };

  const openDetails = async (appeal: any) => {
    setViewingAppeal(appeal);
    setViewingItemData(null);
    if (appeal.itemId) {
      const snap = await getDoc(doc(db, 'items', appeal.itemId));
      if (snap.exists()) setViewingItemData(snap.data());
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      
      <AnimatePresence>
        {viewingAppeal && (
          <AppealDetailsDrawer appeal={viewingAppeal} item={viewingItemData} onClose={() => setViewingAppeal(null)} onResolve={handleResolve} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Seller Requests</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Price Appeals</h1>
      </div>

      {/* Main List Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Pending Appeals</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Sellers requesting an exemption above the campus price limit.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {appeals.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : appeals.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">No pending appeals</p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <div key={appeal.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-100/50 transition-all">
                
                {/* Col 1-5: Issue details */}
                <div className="md:col-span-6 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                    <MessageSquare size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 leading-tight truncate">{appeal.itemTitle || 'Unnamed Item'}</h3>
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">#{appeal.id.substring(0,8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Col 6-9: Seller */}
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Appealed By</p>
                  <p className="text-[13px] font-semibold text-slate-700">{appeal.sellerName || 'Unknown Seller'}</p>
                </div>

                {/* Col 10-12: Actions */}
                <div className="md:col-span-3 flex items-center justify-end">
                  <button onClick={() => openDetails(appeal)}
                    className="h-10 px-6 rounded-xl text-[12px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                    Review Appeal
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
