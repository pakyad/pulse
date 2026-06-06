"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Loader2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { holdEscrow, refundEscrow } from '@/app/actions/adminActions';
import { releaseEscrow } from '@/app/actions/orderActions';
import { motion, AnimatePresence } from 'framer-motion';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmDialog({ action, onClose, onConfirm, isWorking }: any) {
  let title = "";
  let description = "";

  if (action === 'distribute') {
    title = "Distribute Escrow Funds";
    description = "Funds will be immediately released to the Seller and Runner. The Escrow will be marked as RELEASED.";
  } else if (action === 'hold') {
    title = "Hold Escrow Funds";
    description = "Funds will be locked by Admin and the 24-hour auto-release timer will be suspended. The Seller will not receive payment yet.";
  } else if (action === 'refund') {
    title = "Refund Escrow Funds";
    description = "The Buyer will receive a full refund. The Seller and Runner will not receive payment. The Escrow will be closed.";
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
              action === 'refund' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Order Details Drawer ──────────────────────────────────────────────────────
function OrderDetailsDrawer({ order, onClose, onResolve }: { order: any; onClose: () => void; onResolve: (action: string) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!order) return null;

  const calculateTotal = (o: any) => {
    const sum = Number(o.item_total || o.items_total || 0) + Number(o.runner_fee || o.delivery_fee || 0);
    return sum > 0 ? sum : Number(o.grand_total || o.total || o.price || 0);
  };

  const itemTotal = Number(order.item_total || order.items_total || 0).toFixed(2);
  const runnerFee = Number(order.runner_fee || order.delivery_fee || 0).toFixed(2);
  const total = calculateTotal(order).toFixed(2);

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
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Escrow Details</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Transaction Summary</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Order ID</span>
                <span className="font-bold text-slate-900">#{order.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Status</span>
                <span className="font-bold text-slate-900">{order.status}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Created At</span>
                <span className="font-bold text-slate-900">{order.created_at?.toDate ? order.created_at.toDate().toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Financial Breakdown</h3>
            <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Item Total (Seller)</span>
                <span className="font-bold text-slate-900">RM {itemTotal}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Delivery Fee (Runner)</span>
                <span className="font-bold text-slate-900">RM {runnerFee}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-[14px]">
                <span className="font-bold text-slate-900">Total Escrowed</span>
                <span className="font-bold text-slate-900">RM {total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Parties Involved</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Buyer</p>
                <p className="text-[13px] font-bold text-slate-900">{order.buyer_name || 'Unknown'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Seller</p>
                <p className="text-[13px] font-bold text-slate-900">{order.seller_name || 'Unknown'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Runner</p>
                <p className="text-[13px] font-bold text-slate-900">{order.runner_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="p-8 border-t border-slate-100 bg-white space-y-4">
          <h3 className="text-[12px] font-bold text-slate-900">Escrow Controls</h3>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setConfirmAction('refund')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-red-700">Refund</span>
            </button>
            <button onClick={() => setConfirmAction('hold')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-amber-700">Hold</span>
            </button>
            <button onClick={() => setConfirmAction('distribute')}
              className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 transition-all group shadow-md shadow-slate-900/10">
              <span className="text-[13px] font-bold text-white">Distribute</span>
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}

// ── Main Escrow Page ──────────────────────────────────────────────────────────
export default function AdminEscrowPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [adminUid, setAdminUid] = useState<string>('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) setAdminUid(user.uid);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const qOrders = query(
      collection(db, 'orders'),
      where('status', 'in', ['DELIVERED', 'COMPLETED'])
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const lockedOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((o: any) => o.status === 'DELIVERED' && o.escrow_status !== 'RELEASED');
      setOrders(lockedOrders);
    });

    const qDisputes = query(collection(db, 'disputes'));
    const unsubDisputes = onSnapshot(qDisputes, (snap) => {
      setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubOrders(); unsubDisputes(); };
  }, []);

  const handleAction = async (action: string) => {
    if (!viewingOrder) return;
    try {
      let res;
      if (action === 'distribute') res = await releaseEscrow(viewingOrder.id, adminUid);
      if (action === 'hold') res = await holdEscrow(viewingOrder.id, adminUid);
      if (action === 'refund') res = await refundEscrow(viewingOrder.id, adminUid);
      
      if (!res?.success) throw new Error(res?.message || 'Failed to complete action');
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const calculateTotal = (o: any) => {
    const sum = Number(o.item_total || o.items_total || 0) + Number(o.runner_fee || o.delivery_fee || 0);
    return sum > 0 ? sum : Number(o.grand_total || o.total || o.price || 0);
  };

  const totalLocked = orders.reduce((acc, o) => acc + calculateTotal(o), 0);

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      
      <AnimatePresence>
        {viewingOrder && (
          <OrderDetailsDrawer order={viewingOrder} onClose={() => setViewingOrder(null)} onResolve={handleAction} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Financial Control</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Escrow Wallet</h1>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">System Locked Funds</h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Total funds waiting to be released or refunded.
          </p>
        </div>
        
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-500">Current Balance</p>
          <p className="text-[24px] font-bold text-slate-900">RM {totalLocked.toFixed(2)}</p>
        </div>
      </div>

      {/* Pending Queue */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Action Required</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Orders waiting for your decision.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {orders.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {orders.length === 0 && !loading ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">Wallet is clear</p>
            </div>
          ) : (
            orders.map(order => {
              const hasRisk = !!disputes.find(d => d.order_id === order.id && d.status !== 'RESOLVED');
              const orderAmount = calculateTotal(order);

              return (
                <div key={order.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-100/50 transition-all">
                  
                  {/* Col 1-6: Order ID */}
                  <div className="md:col-span-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                      <ShieldCheck size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                        {hasRisk && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">Dispute Risk</span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400">Waiting for release</p>
                    </div>
                  </div>

                  {/* Col 7-9: Amount */}
                  <div className="md:col-span-3">
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">Escrow Total</p>
                    <p className="text-[15px] font-bold text-slate-900">RM {orderAmount.toFixed(2)}</p>
                  </div>

                  {/* Col 10-12: Actions */}
                  <div className="md:col-span-3 flex items-center justify-end">
                    <button onClick={() => setViewingOrder(order)}
                      className="h-10 px-6 rounded-xl text-[12px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                      Review Escrow
                    </button>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
