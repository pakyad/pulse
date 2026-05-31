"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PriceAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export default function PriceAppealModal({ isOpen, onClose, item }: PriceAppealModalProps) {
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!justification || justification.length < 10) {
      alert("Please provide a substantial justification (min 10 chars).");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "appeals"), {
        itemId: item.id,
        itemTitle: item.title,
        price: item.price,
        category: item.category,
        sellerId: auth.currentUser?.uid,
        sellerName: auth.currentUser?.displayName || 'Pulse Vendor',
        justification_text: justification,
        status: 'PENDING',
        created_at: serverTimestamp()
      });
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Institutional Handshake Failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl border-[0.5px] border-white/20 shadow-md overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><ShieldAlert size={20} /></div>
                  <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-tight">Institutional Directive</h3>
               </div>
               <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-10 space-y-8">
               {isSuccess ? (
                 <div className="py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                       <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-[20px] font-black tracking-tight">Appeal Registered</h4>
                       <p className="text-[14px] font-medium text-slate-400">Your justification has been queued for administrative audit. The asset remains locked until a decision is reached.</p>
                    </div>
                    <button onClick={onClose} className="w-full h-14 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md shadow-black/10">Close Terminal</button>
                 </div>
               ) : (
                 <>
                   <div className="space-y-3">
                      <p className="text-[14px] font-medium text-slate-500 leading-relaxed">
                        Asset <span className="font-bold text-slate-900">"{item.title}"</span> has been flagged by the Autonomous Price Sentinel. Proposed price <span className="font-bold text-red-500">RM{item.price}</span> exceeds the institutional ceiling for the <span className="font-bold text-slate-900">{item.category}</span> category.
                      </p>
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                         <AlertCircle size={16} className="text-red-500 mt-0.5" />
                         <p className="text-[11px] font-bold text-red-600/80 uppercase tracking-widest leading-relaxed">The asset is currently hidden from the marketplace registry.</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Exemption Justification</label>
                      <textarea 
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Detail why this asset requires a premium price ceiling (e.g., Rare club merch, imported tech, bundle pack)..."
                        className="w-full h-32 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] font-medium placeholder:text-slate-300 focus:border-slate-900 transition-all outline-none resize-none"
                      />
                   </div>

                   <button 
                     onClick={handleSubmit}
                     disabled={isSubmitting || justification.length < 10}
                     className="w-full h-16 bg-black text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-md shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
                   >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Directive Appeal'}
                   </button>
                 </>
               )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
