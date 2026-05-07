"use client";

import { useState } from 'react';
import { approveListing, rejectListing } from '@/app/actions/adminActions';
import { Check, X, AlertCircle, Clock, Tag, User, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminProductApprovalsProps {
  items: any[];
  guidelines: Record<string, number>;
}

export default function AdminProductApprovals({ items, guidelines }: AdminProductApprovalsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const monitorItems = items.filter(item => {
    const limit = guidelines[item.category] || 9999;
    return item.price > limit;
  });

  if (monitorItems.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-[24px] bg-emerald-50 flex items-center justify-center mb-6">
          <Check size={24} className="text-emerald-500" />
        </div>
        <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-widest">Registry Stable</h3>
        <p className="text-[13px] text-slate-400 mt-2 font-medium">All campus listings are within institutional limits.</p>
      </div>
    );
  }

  const handleSuspend = async (id: string) => {
    if (!window.confirm("Operational Directive: Suspend this asset immediately?")) return;
    setProcessingId(id);
    try {
      const { db } = await import('@/lib/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, "items", id), { status: "SUSPENDED" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {monitorItems.map((item) => {
          const suggestedLimit = guidelines[item.category] || 0;
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[32px] border-[0.5px] border-slate-100 p-8 shadow-sm hover:shadow-xl shadow-slate-200/50 transition-all group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                  <h3 className="text-[20px] font-black text-slate-900 tracking-tight leading-none pr-12">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-lg uppercase tracking-widest border border-red-100 flex items-center gap-2 shadow-sm shadow-red-500/10">
                      <AlertCircle size={12} strokeWidth={3} /> Price Violation
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Market Price</p>
                  <p className="text-[26px] font-black text-slate-900 tracking-tighter">RM {Number(item.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-10 mb-8 border-y border-slate-50 py-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block mb-2">Vendor Node</label>
                    <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700">
                      <User size={16} className="text-slate-300" /> {item.seller_name || 'Verified Vendor'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block mb-2">Classification</label>
                    <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700">
                      <Tag size={16} className="text-slate-300" /> {item.category}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block mb-2">Institutional Limit</label>
                    <div className="flex items-center gap-3 text-[14px] font-black text-emerald-500">
                      <DollarSign size={16} strokeWidth={2.5} /> RM {suggestedLimit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block mb-2">Audit Timestamp</label>
                    <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700">
                      <Clock size={16} className="text-slate-300" /> {item.created_at ? new Date(item.created_at.toMillis()).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Terminal */}
              <button 
                disabled={processingId === item.id}
                onClick={() => handleSuspend(item.id)}
                className="w-full h-[64px] bg-slate-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-black/10 active:scale-95"
              >
                {processingId === item.id ? <Loader2 className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
                SUSPEND ASSET IMMEDIATELY
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
