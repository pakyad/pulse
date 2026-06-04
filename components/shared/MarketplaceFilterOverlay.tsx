import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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

  // Sync temp filters with active filters when the overlay opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
    }
  }, [isOpen, filters]);

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
            className="fixed inset-0 z-100 bg-slate-900/10 backdrop-blur-md"
          />

          {/* Filter Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-101 w-full max-w-[340px] bg-white flex flex-col shadow-2xl"
          >
            {/* Header (No text, just close button) */}
            <div className="px-8 pt-10 pb-2 flex justify-end">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 space-y-10">
              
              {/* Sort Section */}
              <section>
                <h3 className="text-[12px] font-black text-slate-900 tracking-tight mb-4">Sort By</h3>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'newest', label: 'Newest Arrivals' },
                    { id: 'price_asc', label: 'Lowest Price' },
                    { id: 'price_desc', label: 'Highest Price' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTempFilters({ ...tempFilters, sortBy: opt.id as any })}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${
                        tempFilters.sortBy === opt.id 
                          ? 'bg-white border-[#2A5C50] text-[#2A5C50] ring-1 ring-[#2A5C50]' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Budget Section */}
              <section>
                <h3 className="text-[12px] font-black text-slate-900 tracking-tight mb-4">Budget</h3>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { label: 'Any Budget', max: 1000 },
                    { label: '< RM 50', max: 50 },
                    { label: '< RM 150', max: 150 },
                    { label: '< RM 300', max: 300 },
                  ].map((tier) => (
                    <button
                      key={tier.max}
                      onClick={() => setTempFilters({ ...tempFilters, priceRange: [0, tier.max] })}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${
                        tempFilters.priceRange[1] === tier.max 
                          ? 'bg-white border-[#2A5C50] text-[#2A5C50] ring-1 ring-[#2A5C50]' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Status Section */}
              <section>
                 <h3 className="text-[12px] font-black text-slate-900 tracking-tight mb-4">Seller Type</h3>
                 <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setTempFilters({ ...tempFilters, officialOnly: false })}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${
                        !tempFilters.officialOnly 
                          ? 'bg-white border-[#2A5C50] text-[#2A5C50] ring-1 ring-[#2A5C50]' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      All Sellers
                    </button>
                    <button
                      onClick={() => setTempFilters({ ...tempFilters, officialOnly: true })}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${
                        tempFilters.officialOnly 
                          ? 'bg-white border-[#2A5C50] text-[#2A5C50] ring-1 ring-[#2A5C50]' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      Official Only
                    </button>
                 </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-8 pb-10 pt-6 bg-white space-y-4">
              <button 
                onClick={() => {
                  onApply(tempFilters);
                  onClose();
                }}
                className="w-full h-14 bg-[#2A5C50] text-white rounded-2xl font-bold text-[14px] active:scale-95 transition-all shadow-md shadow-[#2A5C50]/20 flex items-center justify-center"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleReset}
                className="w-full h-10 text-slate-400 font-bold text-[12px] hover:text-slate-900 transition-colors flex items-center justify-center"
              >
                Reset Selection
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
