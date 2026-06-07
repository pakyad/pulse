"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { approveItem, rejectItem, issueWarning, holdForRevision } from '@/app/actions/adminActions';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import { Loader2, CheckCircle2, ImageOff, X, AlertTriangle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

//  Confirm Modal 
function ConfirmDialog({ action, onClose, onConfirm, isWorking }: any) {
  let title = "";
  let description = "";

  if (action === 'approve') {
    title = "Approve Listing";
    description = "The item will be marked active. The system will stop flagging this item's price.";
  } else if (action === 'reject') {
    title = "Reject Listing";
    description = "The item will be permanently removed. The seller will be notified of a policy violation.";
  } else if (action === 'hold') {
    title = "Hold for Revision";
    description = "The item will be temporarily hidden. The seller will be asked to lower the price.";
  } else if (action === 'warn') {
    title = "Issue Warning";
    description = "The seller will receive a strike for persistent price gouging. 3 strikes result in a ban.";
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
              action === 'reject' || action === 'warn' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

//  Item Details Drawer 
function ItemDetailsDrawer({ item, onClose, onResolve }: { item: any; onClose: () => void; onResolve: (action: string) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!item) return null;

  const images = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
  const catConfig = MARKETPLACE_CATEGORIES[item.category as CategoryID];
  const ceiling = catConfig?.ceiling || 0;

  const executeResolution = async (action: string) => {
    setIsWorking(true);
    await onResolve(action);
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
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Price Review</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Flag Context</h3>
            <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-red-400">Trigger Source</span>
                <span className="font-bold text-red-900">{item.flag_source || 'AI System'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-red-400">Listed Price</span>
                <span className="font-bold text-red-900">RM {Number(item.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-red-400">Campus Ceiling</span>
                <span className="font-bold text-red-900">RM {ceiling.toFixed(2)}</span>
              </div>
              {item.price_appeal && (
                <div className="pt-3 border-t border-red-200">
                  <p className="text-[10px] font-semibold text-red-400 mb-1">Seller Justification</p>
                  <p className="text-[12px] font-medium text-red-900 bg-red-100/50 p-3 rounded-xl">{item.price_appeal}</p>
                </div>
              )}
              {item.pcs_result?.justification && (
                <div className="pt-3 border-t border-red-200">
                  <p className="text-[10px] font-semibold text-red-400 mb-1">AI Justification (PCS)</p>
                  <p className="text-[12px] font-medium text-red-900 bg-red-100/50 p-3 rounded-xl">{item.pcs_result.justification}</p>
                  {item.pcs_result.marketPrice > 0 && (
                    <div className="mt-2 flex gap-4 text-[11px]">
                      <span className="text-red-400">Market Price: <strong className="text-red-900">RM {item.pcs_result.marketPrice.toFixed(2)}</strong></span>
                      <span className="text-red-400">Max Allowed: <strong className="text-red-900">RM {item.pcs_result.maxAllowedPrice.toFixed(2)}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Product Information</h3>
            <div className="p-5 bg-white shadow-sm rounded-2xl border border-slate-100 space-y-4">
              {images.length > 0 ? (
                <div className="w-full h-40 bg-slate-50 rounded-xl overflow-hidden">
                  <img src={images[0]} className="w-full h-full object-cover" alt="Item" />
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <ImageOff size={20} className="text-slate-300" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Title</p>
                <p className="text-[14px] font-bold text-slate-900">{item.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Description</p>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-4">{item.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Seller</p>
                <p className="text-[13px] font-bold text-slate-900">{item.seller_name || 'Unknown'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="p-8 border-t border-slate-100 bg-white space-y-4">
          <h3 className="text-[12px] font-bold text-slate-900">Adjudication Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setConfirmAction('reject')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-red-700">Reject Item</span>
            </button>
            <button onClick={() => setConfirmAction('warn')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-red-700">Issue Warning</span>
            </button>
            <button onClick={() => setConfirmAction('hold')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-amber-700">Hold & Request Lower Price</span>
            </button>
            <button onClick={() => setConfirmAction('approve')}
              className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 transition-all group shadow-md shadow-slate-900/10">
              <span className="text-[13px] font-bold text-white">Approve Price</span>
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}

//  Main Page 
export default function PriceReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [reviewedItems, setReviewedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedLoading, setReviewedLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [tab, setTab] = useState<'flagged' | 'reviewed'>('flagged');

  useEffect(() => {
    const q = query(
      collection(db, 'items'),
      where('is_price_flagged', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'items'),
      where('pcs_result', '!=', null)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((i: any) => i.pcs_result && (i.status === 'ACTIVE' || i.status === 'REJECTED_BY_ADMIN'))
        .sort((a: any, b: any) => (b.pcs_result?.checkedAt?.toMillis?.() || 0) - (a.pcs_result?.checkedAt?.toMillis?.() || 0));
      setReviewedItems(all);
      setReviewedLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (action: string) => {
    if (!viewingItem) return;
    const adminId = auth.currentUser?.uid || 'ADMIN';
    try {
      let res: any;
      if (action === 'approve')  res = await approveItem(viewingItem.id, adminId);
      if (action === 'reject')   res = await rejectItem(viewingItem.id, viewingItem.seller_id, adminId);
      if (action === 'warn')     res = await issueWarning(viewingItem.id, viewingItem.seller_id, adminId, viewingItem.title);
      if (action === 'hold')     res = await holdForRevision(viewingItem.id, viewingItem.seller_id, adminId, 'PRICE_TOO_HIGH', 'Please lower the price to comply with campus limits.');
      
      if (!res?.success) {
        setError(res?.message || 'Something went wrong.');
      }
    } catch { 
      setError('Action failed. Try again.'); 
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      <AnimatePresence>
        {viewingItem && (
          <ItemDetailsDrawer item={viewingItem} onClose={() => setViewingItem(null)} onResolve={handleAction} />
        )}
      </AnimatePresence>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[12px] font-medium text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 ml-4"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Governance Engine</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Price Review</h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 w-fit">
        <button onClick={() => setTab('flagged')}
          className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${tab === 'flagged' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
          Flagged Listings
        </button>
        <button onClick={() => setTab('reviewed')}
          className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${tab === 'reviewed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
          Reviewed
        </button>
      </div>

      {/* Flagged Listings */}
      {tab === 'flagged' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">Flagged Listings</h2>
              <p className="text-[12px] text-slate-400 mt-1">
                Items priced abnormally high requiring admin intervention.
              </p>
            </div>
            <span className="px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-[11px] font-bold text-red-600">
              {items.length} Review Required
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-500">No flagged listings</p>
              </div>
            ) : (
              items.map((item) => {
                const catConfig = MARKETPLACE_CATEGORIES[item.category as CategoryID];
                const ceiling = catConfig?.ceiling || 0;
                
                return (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-100/50 transition-all">
                    
                    {/* Col 1-6: Item Details */}
                    <div className="md:col-span-6 flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                        <Search size={16} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">#{item.id.substring(0,8).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Col 7-9: Price & Ceiling */}
                    <div className="md:col-span-3">
                      <p className="text-[15px] font-bold text-red-600">RM {Number(item.price).toFixed(2)}</p>
                      {ceiling > 0 && (
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Limit: RM {ceiling.toFixed(2)}</p>
                      )}
                      <p className="text-[9px] font-bold mt-0.5 text-slate-400 uppercase tracking-wider">{item.flag_source === 'SELLER_APPEAL' ? 'Appeal' : item.flag_source === 'COMMUNITY' ? 'Community Flagged' : 'System Flagged'}</p>
                    </div>

                    {/* Col 10-12: Action Button */}
                    <div className="md:col-span-3 flex items-center justify-end">
                      <button onClick={() => setViewingItem(item)}
                        className="h-10 px-6 rounded-xl text-[12px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                        Review Pricing
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reviewed Tab */}
      {tab === 'reviewed' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">Reviewed Items</h2>
              <p className="text-[12px] text-slate-400 mt-1">
                Items that have been checked by PCS (Claude) AI.
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
              {reviewedItems.length} Reviewed
            </span>
          </div>

          <div className="space-y-4">
            {reviewedLoading ? (
              <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
            ) : reviewedItems.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-500">No reviewed items</p>
              </div>
            ) : (
              reviewedItems.map((item) => {
                const decidedBy = item.pcs_result?.isJustified !== undefined ? 'Claude' : 'Admin';
                const decision = item.status === 'ACTIVE' ? 'Approved' : 'Rejected';
                return (
                  <div key={item.id} className="h-14 px-5 bg-white rounded-xl border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#F9FAFB] transition-all">
                    <div className="md:col-span-4">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${decision === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {decision}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[11px] text-slate-500">{decidedBy}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[11px] text-slate-400">
                        {item.pcs_result?.checkedAt?.toMillis
                          ? new Date(item.pcs_result.checkedAt.toMillis()).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-slate-400 truncate">{item.pcs_result?.justification || ''}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
