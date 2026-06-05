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
  condition: 'any' | 'new' | 'used';
  fulfillment: 'any' | 'meetup' | 'runner';
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
      officialOnly: false,
      condition: 'any',
      fulfillment: 'any'
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
            className="fixed top-0 right-0 bottom-0 z-101 w-full max-w-[340px] bg-white flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.12)] rounded-l-[24px]"
          >
            {/* Header (No text, just close button) */}
            <div className="px-8 pt-10 pb-2 flex justify-end">
              <button 
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 space-y-10">
              
              {/* Sort Section */}
              <section>
                <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Sort By</h3>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'newest', label: 'Newest Arrivals' },
                    { id: 'price_asc', label: 'Lowest Price' },
                    { id: 'price_desc', label: 'Highest Price' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTempFilters({ ...tempFilters, sortBy: opt.id as any })}
                      className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                        tempFilters.sortBy === opt.id 
                          ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Budget Section */}
              <section>
                <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Budget</h3>
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
                      className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                        tempFilters.priceRange[1] === tier.max 
                          ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Status Section */}
              <section>
                 <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Seller Type</h3>
                 <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setTempFilters({ ...tempFilters, officialOnly: false })}
                      className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                        !tempFilters.officialOnly 
                          ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      All Sellers
                    </button>
                    <button
                      onClick={() => setTempFilters({ ...tempFilters, officialOnly: true })}
                      className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                        tempFilters.officialOnly 
                          ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Official Only
                    </button>
                 </div>
              </section>

              {/* Condition Section */}
              <section>
                 <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Item Condition</h3>
                 <div className="flex flex-wrap gap-2.5">
                   {[
                     { id: 'any', label: 'Any Condition' },
                     { id: 'new', label: 'Brand New' },
                     { id: 'used', label: 'Pre-loved' }
                   ].map((opt) => (
                     <button
                       key={opt.id}
                       onClick={() => setTempFilters({ ...tempFilters, condition: opt.id as any })}
                       className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                         tempFilters.condition === opt.id 
                           ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                           : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                       }`}
                     >
                       {opt.label}
                     </button>
                   ))}
                 </div>
              </section>

              {/* Fulfillment Section */}
              <section>
                 <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Fulfillment</h3>
                 <div className="flex flex-wrap gap-2.5">
                   {[
                     { id: 'any', label: 'Any Method' },
                     { id: 'meetup', label: 'Meetup / COD' },
                     { id: 'runner', label: 'Pulse Runner' }
                   ].map((opt) => (
                     <button
                       key={opt.id}
                       onClick={() => setTempFilters({ ...tempFilters, fulfillment: opt.id as any })}
                       className={`px-5 py-2.5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${
                         tempFilters.fulfillment === opt.id 
                           ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' 
                           : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                       }`}
                     >
                       {opt.label}
                     </button>
                   ))}
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
                className="w-full h-14 bg-slate-900 text-white rounded-[16px] font-bold text-[14px] active:scale-95 transition-all shadow-md flex items-center justify-center"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleReset}
                className="w-full h-10 text-slate-500 font-semibold text-[13px] hover:text-slate-800 transition-colors flex items-center justify-center"
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
