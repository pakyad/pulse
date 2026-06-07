"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Store, Plus, X, Loader2, CheckCircle2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = [
  { value: 'club', label: 'Academic Club' },
  { value: 'official_store', label: 'Official UniKL Store' },
  { value: 'service_provider', label: 'Service Provider' },
];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState('club');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'merchant'));
    const unsub = onSnapshot(q, (snap) => {
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users'), {
        full_name: formName.trim(),
        email: formEmail.trim(),
        role: 'merchant',
        merchant_category: formCategory,
        merchant_description: formDescription.trim(),
        is_seller: true,
        created_at: serverTimestamp(),
      });
      showToast('Merchant account created.');
      setFormName('');
      setFormEmail('');
      setFormCategory('club');
      setFormDescription('');
      setShowForm(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to create merchant.');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), { role });
      showToast(role === 'student' ? 'Merchant removed.' : 'Merchant suspended.');
    } catch (e: any) {
      showToast(e.message || 'Failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 px-6 py-3 rounded-full shadow-lg bg-slate-900 text-white text-[13px] font-bold">
          {toast}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 mb-1">Network</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Merchant Registry</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">Manage campus merchants and their access.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm">
          <Plus size={15} />
          Add Merchant
        </button>
      </div>

      {/* Add Merchant Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Add New Merchant</h2>
                <p className="text-[12px] text-slate-400 mt-1">Create a new merchant account on the Pulse network.</p>
              </div>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Full Name</p>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Email</p>
                <input value={formEmail} onChange={e => setFormEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Category</p>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors">
                  {CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400">Description</p>
                <input value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-11 rounded-xl text-[13px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!formName.trim() || !formEmail.trim() || saving}
                className="flex-1 h-11 rounded-xl text-[13px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={15} />}
                Create Merchant Account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Merchants */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Active Merchants</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              All merchants with active marketplace access.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {merchants.length} Active
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : merchants.length === 0 ? (
            <div className="py-12 text-center">
              <Store size={32} className="mx-auto mb-3 text-[#D1D5DB]" />
              <p className="text-[13px] font-bold text-[#6B7280]">No merchants registered</p>
            </div>
          ) : (
            merchants.map((m) => {
              const initials = (m.full_name || 'M').charAt(0).toUpperCase();
              const catLabel = CATEGORY_OPTIONS.find(o => o.value === m.merchant_category)?.label || m.merchant_category || 'Club';
              return (
                <div key={m.id} className="h-16 px-5 bg-white rounded-xl border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#F9FAFB] transition-all">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-amber-600 text-[13px] font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{m.full_name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[9px] font-semibold rounded-md">{catLabel}</span>
                  </div>
                  <div className="md:col-span-3 flex items-center gap-2">
                    <button onClick={() => window.open(`/marketplace?merchant=${m.id}`, '_blank')}
                      className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] hover:bg-slate-50 transition-all active:scale-95">
                      View Listings
                    </button>
                  </div>
                  <div className="md:col-span-3 flex items-center justify-end gap-2">
                    <button onClick={() => updateRole(m.id, 'suspended_merchant')}
                      className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] hover:bg-slate-50 transition-all active:scale-95">
                      Suspend
                    </button>
                    <button onClick={() => updateRole(m.id, 'student')}
                      className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all active:scale-95">
                      Remove
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
