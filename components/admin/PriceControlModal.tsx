"use client";

import { useState } from 'react';
import { X, ShieldCheck, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: string, price: number) => void;
}

export default function PriceControlModal({ isOpen, onClose, onSave }: PriceControlModalProps) {
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

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
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[500px] bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white"
        >
          <div className="p-10">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                <ShieldCheck size={28} />
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-10">
              <h2 className="text-[26px] font-black text-slate-900 tracking-tight mb-2">Price Governance</h2>
              <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Establish institutional limits for marketplace categories to prevent inflation and ensure fair campus commerce.</p>
            </div>

            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Category</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Tech Assets"
                  className="w-full h-[56px] bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[15px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Max Base Price (RM)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">RM</span>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-[56px] bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 text-[15px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                if (category && price) {
                  onSave(category, Number(price));
                  onClose();
                }
              }}
              className="w-full h-[64px] bg-slate-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-[0.98]"
            >
              Set Institutional Limit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
