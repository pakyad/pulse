import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowDownWideNarrow, 
  Banknote, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface MarketplaceFilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  sortBy: 'newest' | 'price_asc' | 'price_desc';
  priceRange: [number, number];
  officialOnly: boolean;
}

export default function MarketplaceFilterOverlay({ isOpen, onClose, filters, onApply }: MarketplaceFilterOverlayProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const sortOptions = [
    { id: 'newest', label: 'Chronological', icon: Clock },
    { id: 'price_asc', label: 'Value: Low to High', icon: Banknote },
    { id: 'price_desc', label: 'Value: High to Low', icon: Banknote },
  ];

  const handleReset = () => {
    setTempFilters({
      sortBy: 'newest',
      priceRange: [0, 1000],
      officialOnly: false
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/10 backdrop-blur-md"
          />

          {/* Filter Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-[320px] bg-white shadow-md flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className="px-6 pt-12 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Registry Audit</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filter Parameters</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10">
              
              {/* Sort Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                   <ArrowDownWideNarrow size={14} className="text-slate-900" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Sequence Protocol</h3>
                </div>
                <div className="space-y-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTempFilters({ ...tempFilters, sortBy: opt.id as any })}
                      className={`w-full h-14 px-4 rounded-2xl flex items-center justify-between border transition-all ${
                        tempFilters.sortBy === opt.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <opt.icon size={16} strokeWidth={tempFilters.sortBy === opt.id ? 2.5 : 1.5} />
                        <span className="text-[13px] font-bold">{opt.label}</span>
                      </div>
                      {tempFilters.sortBy === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Price Range */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                   <Banknote size={14} className="text-emerald-600" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Value Threshold</h3>
                </div>
                <div className="px-2 pt-2">
                  <div className="flex justify-between mb-4">
                    <span className="text-[13px] font-bold text-slate-900">RM 0</span>
                    <span className="text-[13px] font-bold text-slate-900">RM {tempFilters.priceRange[1]}+</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    step="50"
                    value={tempFilters.priceRange[1]}
                    onChange={(e) => setTempFilters({ ...tempFilters, priceRange: [0, parseInt(e.target.value)] })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[10px] font-medium text-slate-400 mt-3 italic">Limit search results to assets within this range.</p>
                </div>
              </section>

              {/* Status Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-slate-900" />
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Trust Protocol</h3>
                </div>
                <button
                  onClick={() => setTempFilters({ ...tempFilters, officialOnly: !tempFilters.officialOnly })}
                  className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    tempFilters.officialOnly 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tempFilters.officialOnly ? 'bg-slate-900 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                      <ShieldCheck size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className={`text-[13px] font-bold ${tempFilters.officialOnly ? 'text-blue-900' : 'text-slate-900'}`}>Official Only</p>
                      <p className="text-[10px] font-medium text-slate-400">Filter for verified club assets.</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full p-1 transition-all ${tempFilters.officialOnly ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <motion.div 
                      animate={{ x: tempFilters.officialOnly ? 20 : 0 }}
                      className="w-3 h-3 bg-white rounded-full shadow-sm" 
                    />
                  </div>
                </button>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 space-y-3">
              <button 
                onClick={() => {
                  onApply(tempFilters);
                  onClose();
                }}
                className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-bold text-[14px] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Sync Registry
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={handleReset}
                className="w-full h-12 text-slate-400 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-900 transition-colors"
              >
                <RotateCcw size={12} />
                Reset Parameters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
