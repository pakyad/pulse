"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, Loader2, X, ImageOff, MessageSquare, AlertTriangle, Bot, History, Scale, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

//  Appeal Details Drawer 
function AppealDetailsDrawer({ appeal, item, onClose, onResolve }: { appeal: any; item: any; onClose: () => void; onResolve: (appeal: any, action: string, negotiatedPrice?: number) => Promise<void> }) {
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeResult, setClaudeResult] = useState<any>(null);
  const [precedents, setPrecedents] = useState<any[]>([]);
  const [precedentLoading, setPrecedentLoading] = useState(true);
  const [negotiating, setNegotiating] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!appeal) return null;

  const images = item?.images?.length ? item.images : item?.image_url ? [item.image_url] : [];
  const catConfig = MARKETPLACE_CATEGORIES[item?.category as CategoryID];
  const itemTitle = appeal.itemTitle || item?.title || 'Unknown';
  const itemCategory = catConfig?.label || item?.category || 'Unknown';
  const appealPrice = Number(appeal.price || item?.price || 0);

  useEffect(() => {
    if (!item?.category) {
      setPrecedentLoading(false);
      return;
    }
    const q = query(
      collection(db, 'activityLogs'),
      where('action', '==', 'ADJUDICATION'),
      where('category', '==', item?.category)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPrecedents(all.slice(-3).reverse());
      setPrecedentLoading(false);
    });
    return () => unsub();
  }, [item?.category]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const runClaude = async () => {
    setClaudeLoading(true);
    setClaudeResult(null);
    try {
      const res = await fetch('/api/pcs-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: itemTitle,
          category: itemCategory,
          price: appealPrice,
          justification: appeal.justification_text || '',
        }),
      });
      const data = await res.json();
      setClaudeResult(data);
    } catch {
      setClaudeResult({ error: 'Failed to reach Claude.' });
    } finally {
      setClaudeLoading(false);
    }
  };

  const executeAction = async (action: string) => {
    setIsWorking(true);
    await onResolve(appeal, action, action === 'APPROVE_NEGOTIATED' ? Number(negotiatedPrice) : undefined);
    setIsWorking(false);
    showToast(action === 'APPROVE_LISTED' ? 'Appeal approved at listed price.' : 'Appeal approved at negotiated price.');
    onClose();
  };

  const requestEvidence = async () => {
    const sellerId = appeal?.sellerId || appeal?.seller_id;
    if (!sellerId) return;
    setIsWorking(true);
    try {
      await updateDoc(doc(db, 'appeals', appeal.id), { status: 'EVIDENCE_REQUESTED' });
      await addDoc(collection(db, 'notifications'), {
        userId: sellerId,
        type: 'EVIDENCE_REQUEST',
        title: 'Evidence Required for Your Appeal',
        body: `Admin has requested additional evidence for your ${itemTitle} appeal. Please provide receipt or purchase proof.`,
        read: false,
        createdAt: serverTimestamp(),
      });
      showToast('Evidence request sent to seller.');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const rejectAppeal = async () => {
    if (!rejectReason.trim()) return;
    if (!appeal?.itemId) return;
    setIsWorking(true);
    try {
      await updateDoc(doc(db, 'appeals', appeal.id), { status: 'REJECTED' });
      await updateDoc(doc(db, 'items', appeal.itemId), { is_price_flagged: false });
      await addDoc(collection(db, 'activityLogs'), {
        action: 'ADJUDICATION',
        itemId: appeal.itemId,
        category: item?.category ?? null,
        decision: 'REJECTED',
        details: `Appeal rejected. Reason: ${rejectReason}`,
        time: serverTimestamp(),
      });
      const sellerId = appeal.sellerId || appeal.seller_id;
      if (sellerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: sellerId,
          type: 'APPEAL_REJECTED',
          title: 'Your Appeal Has Been Rejected',
          body: `Your appeal for ${itemTitle} was rejected. Reason: ${rejectReason}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      showToast('Appeal rejected.');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Failed.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg bg-slate-900 text-white text-[13px] font-bold">
          {toast}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col">

        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Dossier</p>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Appeal Details</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* SECTION A  Claude Re-evaluation */}
          <div className="space-y-3">
            <button onClick={runClaude} disabled={claudeLoading}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[12px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
              {claudeLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Claude is checking current prices...</>
              ) : (
                <><Bot size={14} /> Re-evaluate with Claude</>
              )}
            </button>
            {claudeResult && !claudeResult.error && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-600 font-medium">Current Market Price</span>
                  <span className="font-bold text-slate-900">RM {claudeResult.currentMarketPrice?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-blue-600 font-medium">Student Max Allowed</span>
                  <span className="font-bold text-slate-900">RM {claudeResult.studentMaxAllowed?.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-blue-700 font-medium mt-1">{claudeResult.reasoning}</p>
                {claudeResult.isJustified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">Justified</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">Not Justified</span>
                )}
              </div>
            )}
            {claudeResult?.error && (
              <p className="text-[11px] text-red-500">Claude unavailable. Try again later.</p>
            )}
          </div>

          {/* Seller's Justification */}
          <div className="space-y-2">
            <h3 className="text-[12px] font-bold text-slate-900">Seller's Justification</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                "{appeal.justification_text || 'No justification provided.'}"
              </p>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-2">
            <h3 className="text-[12px] font-bold text-slate-900">Product Information</h3>
            <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
              {images.length > 0 ? (
                <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden">
                  <img src={images[0]} className="w-full h-full object-cover" alt="Item" />
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <ImageOff size={20} className="text-slate-300" />
                </div>
              )}
              <p className="text-[14px] font-bold text-slate-900">{itemTitle}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Category</p>
                  <p className="text-[13px] font-semibold text-slate-700">{itemCategory}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Appealed Price</p>
                  <p className="text-[13px] font-bold text-slate-900">RM {appealPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B  Precedent Check */}
          <div className="space-y-2">
            <h3 className="text-[12px] font-bold text-slate-900 flex items-center gap-1.5">
              <History size={13} /> Similar Appeals History
            </h3>
            <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3">
              {precedentLoading ? (
                <Loader2 size={14} className="animate-spin text-slate-300 mx-auto" />
              ) : precedents.length === 0 ? (
                <p className="text-[12px] text-slate-400 font-medium">No similar appeals on record.</p>
              ) : (
                precedents.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-slate-700">{p.itemName || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${p.decision === 'Approved' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.decision || 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.time?.toMillis ? new Date(p.time.toMillis()).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* SECTION C  Decision Buttons */}
        <div className="p-6 border-t border-slate-100 bg-white space-y-3">
          {/* Approve at Listed Price */}
          <button onClick={() => executeAction('APPROVE_LISTED')} disabled={isWorking}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50">
            Approve at Listed Price
          </button>

          {/* Approve at Negotiated Price */}
          {negotiating ? (
            <div className="flex gap-2">
              <input value={negotiatedPrice} onChange={e => setNegotiatedPrice(e.target.value)} placeholder="Enter approved price (RM)" type="number" step="0.01"
                className="flex-1 h-11 px-4 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:border-slate-900" />
              <button onClick={() => executeAction('APPROVE_NEGOTIATED')} disabled={!negotiatedPrice || isWorking}
                className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1">
                <Send size={13} /> Confirm
              </button>
            </div>
          ) : (
            <button onClick={() => setNegotiating(true)} disabled={isWorking}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50">
              Approve at Negotiated Price
            </button>
          )}

          {/* Request Evidence */}
          <button onClick={requestEvidence} disabled={isWorking}
            className="w-full h-11 rounded-xl border-2 border-amber-400 text-amber-600 text-[12px] font-bold hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50">
            Request Evidence
          </button>

          {/* Reject */}
          {rejecting ? (
            <div className="space-y-2">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection:"
                rows={2} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 focus:outline-none focus:border-slate-900 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setRejecting(false)} className="flex-1 h-10 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-400 hover:bg-slate-50">Cancel</button>
                <button onClick={rejectAppeal} disabled={!rejectReason.trim() || isWorking}
                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold disabled:opacity-50">Confirm Reject</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setRejecting(true)} disabled={isWorking}
              className="w-full h-11 rounded-xl border-2 border-red-300 text-red-500 text-[12px] font-bold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50">
              Reject Appeal
            </button>
          )}
        </div>

      </motion.div>
    </>
  );
}

//  Main Page 
export default function AppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const handleResolve = async (appeal: any, action: string, negotiatedPrice?: number) => {
    if (!appeal?.itemId || !appeal?.id) {
      setError('Invalid appeal data.');
      return;
    }
    try {
      const adminId = auth.currentUser?.uid || 'ADMIN';

      const sellerId = appeal.sellerId || appeal.seller_id;
      const itemTitle = appeal.itemTitle || 'Item';

      if (action === 'APPROVE_LISTED') {
        await updateDoc(doc(db, 'items', appeal.itemId), {
          status: 'active',
          is_price_flagged: false,
          pcs_override: true,
          appeal_approved_by: adminId,
          appeal_approved_at: serverTimestamp(),
        });
        await updateDoc(doc(db, 'appeals', appeal.id), { status: 'APPROVED' });
        await addDoc(collection(db, 'activityLogs'), {
          action: 'ADJUDICATION',
          itemId: appeal.itemId,
          category: viewingItemData?.category ?? null,
          decision: 'APPROVED',
          details: `Appeal approved at listed price RM ${Number(appeal.price || viewingItemData?.price || 0).toFixed(2)}`,
          time: serverTimestamp(),
        });
        if (sellerId) {
          await addDoc(collection(db, 'notifications'), {
            userId: sellerId,
            type: 'APPEAL_APPROVED',
            title: 'Your Appeal Has Been Approved',
            body: `Your appeal for ${itemTitle} has been approved at the listed price of RM ${Number(appeal.price || viewingItemData?.price || 0).toFixed(2)}.`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      } else if (action === 'APPROVE_NEGOTIATED') {
        await updateDoc(doc(db, 'items', appeal.itemId), {
          status: 'active',
          price: negotiatedPrice,
          is_price_flagged: false,
          pcs_override: true,
          appeal_approved_by: adminId,
          appeal_approved_at: serverTimestamp(),
        });
        await updateDoc(doc(db, 'appeals', appeal.id), { status: 'APPROVED' });
        await addDoc(collection(db, 'activityLogs'), {
          action: 'ADJUDICATION',
          itemId: appeal.itemId,
          category: viewingItemData?.category ?? null,
          decision: 'APPROVED_NEGOTIATED',
          negotiatedPrice,
          details: `Appeal approved at negotiated price RM ${negotiatedPrice?.toFixed(2)}`,
          time: serverTimestamp(),
        });
        if (sellerId) {
          await addDoc(collection(db, 'notifications'), {
            userId: sellerId,
            type: 'APPEAL_NEGOTIATED',
            title: 'Your Appeal Has Been Approved at a Negotiated Price',
            body: `Your appeal for ${itemTitle} has been approved at RM ${negotiatedPrice?.toFixed(2)}.`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error('[Appeals] failed:', e);
      setError('Failed to process appeal.');
    }
  };

  const openDetails = async (appeal: any) => {
    if (!appeal) return;
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
          <AppealDetailsDrawer appeal={viewingAppeal} item={viewingItemData}
            onClose={() => { setViewingAppeal(null); setViewingItemData(null); }}
            onResolve={handleResolve} />
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[12px] font-medium text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 ml-4"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Seller Requests</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Price Appeals</h1>
        <p className="text-[13px] font-medium text-slate-400 mt-1">Sellers requesting an exemption above the campus price limit.</p>
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
              <div key={appeal.id} className="h-16 px-5 bg-white rounded-xl border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#F9FAFB] transition-all">
                <div className="md:col-span-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{appeal.itemTitle || 'Unnamed Item'}</p>
                    <p className="text-[10px] font-medium text-slate-400">#{appeal.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="md:col-span-3">
                  <p className="text-[12px] text-slate-500">{appeal.sellerName || 'Unknown Seller'}</p>
                </div>
                <div className="md:col-span-3 flex items-center justify-end">
                  <button onClick={() => openDetails(appeal)}
                    className="h-8 px-5 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95">
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
