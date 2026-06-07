"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { restoreFromVault, permanentlyDelete } from '@/app/actions/adminActions';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, RotateCcw, Trash2, Loader2, CheckCircle, X, ShieldOff, Filter, Search } from 'lucide-react';

type VaultFilter = 'ALL' | 'REJECTED' | 'SELLER_SUSPENDED' | 'RESTORED';

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  REJECTED:          { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Rejected' },
  SELLER_SUSPENDED:  { bg: 'bg-slate-900',  text: 'text-white',      label: 'Seller Suspended' },
  RESTORED:          { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Restored' },
  HOLD_FOR_REVISION: { bg: 'bg-amber-50',   text: 'text-amber-600',  label: 'Held' },
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel, isProcessing }: {
  onConfirm: () => void; onCancel: () => void; isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-sm w-full space-y-5">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-[18px] font-semibold text-slate-900">Permanently Delete?</h3>
          <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">
            This removes the item from Firestore entirely. The vault record is kept for audit purposes. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 h-11 bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] border border-slate-100 hover:bg-slate-100 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isProcessing}
            className="flex-1 h-11 bg-red-600 text-white rounded-xl font-bold text-[13px] hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VaultPage() {
  const [entries,     setEntries]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<VaultFilter>('ALL');
  const [processing,  setProcessing]  = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<any>(null); // { vaultId, itemId }
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [vaultSearch, setVaultSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'governance_vault'), where('is_permanently_deleted', '==', false)),
      (snap) => {
        setEntries(
          snap.docs
            .map(d => ({ vaultId: d.id, ...d.data() }))
            .sort((a: any, b: any) => b.vault_timestamp?.toMillis?.() - a.vault_timestamp?.toMillis?.())
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRestore = async (entry: any) => {
    setProcessing(entry.vaultId);
    try {
      const res = await restoreFromVault(entry.vaultId, entry.item_id, entry.seller_id);
      if (res.success) showToast('Listing restored to marketplace.', 'ok');
      else showToast(res.message || 'Failed.', 'err');
    } catch { showToast('Restore failed.', 'err'); }
    finally { setProcessing(null); }
  };

  const handlePermDelete = async () => {
    if (!confirmId) return;
    setProcessing(confirmId.vaultId);
    try {
      const res = await permanentlyDelete(confirmId.vaultId, confirmId.item_id);
      if (res.success) showToast('Permanently deleted.', 'ok');
      else showToast(res.message || 'Failed.', 'err');
    } catch { showToast('Delete failed.', 'err'); }
    finally { setProcessing(null); setConfirmId(null); }
  };

  const FILTERS: { id: VaultFilter; label: string }[] = [
    { id: 'ALL',             label: 'All' },
    { id: 'REJECTED',        label: 'Rejected' },
    { id: 'SELLER_SUSPENDED', label: 'Suspended' },
    { id: 'RESTORED',        label: 'Restored' },
  ];

  const filtered = entries
    .filter(e => filter === 'ALL' || e.vault_action === filter)
    .filter(e => !vaultSearch || e.title?.toLowerCase().includes(vaultSearch.toLowerCase()));

  return (
    <div className="space-y-8 max-w-6xl">
      <AnimatePresence>{toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 px-6 py-3 rounded-full shadow-lg text-white text-[13px] font-bold flex items-center gap-2 ${toast.type === 'ok' ? 'bg-slate-900' : 'bg-red-500'}`}>
          {toast.type === 'ok' ? <CheckCircle size={16} /> : <X size={16} />} {toast.msg}
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>
        {confirmId && (
          <ConfirmModal
            onConfirm={handlePermDelete}
            onCancel={() => setConfirmId(null)}
            isProcessing={processing === confirmId.vaultId}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400  mb-1">Audit Archive</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Governance Vault</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            Every removed listing. Restore false flags or permanently erase.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 ">{entries.length} records</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100 gap-1 w-fit">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${
                filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={vaultSearch} onChange={e => setVaultSearch(e.target.value)} placeholder="Search by item title..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Item</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Action</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Reason</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Removed</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400  text-right">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center">
                <Loader2 className="animate-spin text-slate-300 mx-auto" size={24} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Archive size={28} className="text-slate-200" />
                  <p className="text-[13px] font-bold text-slate-300">Vault is empty</p>
                </div>
              </td></tr>
            ) : filtered.map(entry => {
              const style = ACTION_STYLES[entry.vault_action] || { bg: 'bg-slate-100', text: 'text-slate-500', label: entry.vault_action };
              const isRestored = entry.vault_action === 'RESTORED';
              return (
                <tr key={entry.vaultId} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        {entry.image_url || entry.images?.[0]
                          ? <img src={entry.image_url || entry.images[0]} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><ShieldOff size={14} className="text-slate-300" /></div>}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 leading-tight">{entry.title || 'Unnamed Item'}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{entry.seller_name || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[12px] font-medium text-slate-500 max-w-[200px] truncate">{entry.vault_reason || '—'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-bold text-slate-300 ">
                      {entry.vault_timestamp?.toDate?.().toLocaleDateString() || 'Recently'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {!isRestored && (
                        <button
                          onClick={() => handleRestore(entry)}
                          disabled={processing === entry.vaultId}
                          className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold  hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40">
                          {processing === entry.vaultId ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId({ vaultId: entry.vaultId, item_id: entry.item_id })}
                        disabled={processing === entry.vaultId}
                        className="h-8 px-3 bg-white border border-slate-200 text-slate-400 rounded-lg text-[10px] font-bold  hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-40">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
