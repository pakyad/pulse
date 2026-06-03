"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimplePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: string, price: number, governanceType: 'REGULATED' | 'PREMIUM') => void;
}

export default function SimplePolicyModal({ isOpen, onClose, onSave }: SimplePolicyModalProps) {
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [governanceType, setGovernanceType] = useState<'REGULATED' | 'PREMIUM'>('REGULATED');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-white/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 p-10"
        >
          <div className="mb-10 text-center">
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight uppercase">Economic Policy</h2>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">Registry Price Ceiling Directive</p>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <label className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] block mb-2 text-center">Governance Tier</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                 <button 
                  onClick={() => setGovernanceType('REGULATED')}
                  className={`flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${governanceType === 'REGULATED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                 >
                    Regulated
                 </button>
                 <button 
                  onClick={() => setGovernanceType('PREMIUM')}
                  className={`flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${governanceType === 'PREMIUM' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                 >
                    Premium
                 </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] block mb-2 text-center">Target Category</label>
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Tech Assets"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all placeholder:text-slate-200 text-center"
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] block mb-2 text-center">Price Ceiling (RM)</label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all placeholder:text-slate-200 text-center"
              />
            </div>
          </div>

          <button 
            onClick={() => {
              if (category && price) {
                onSave(category, Number(price), governanceType);
                onClose();
              }
            }}
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95"
          >
            SAVE POLICY
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
