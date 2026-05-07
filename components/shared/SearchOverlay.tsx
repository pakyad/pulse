import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Smartphone, 
  Truck, 
  Newspaper, 
  Zap, 
  GraduationCap, 
  Users,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  items?: any[];
}

export default function SearchOverlay({ isOpen, onClose, items = [] }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    
    // 🏛️ Pulse Institutional Search Protocol
    return items.filter(item => {
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const seller = (item.seller_name || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      
      return title.includes(q) || desc.includes(q) || seller.includes(q) || cat.includes(q);
    }).slice(0, 10);
  }, [query, items]);

  const itemCategories = [
    { label: 'Marketplace Assets', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Campus Logistics', icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Registry Archive', icon: Newspaper, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Node Operations', icon: Smartphone, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-200 bg-white/95 backdrop-blur-3xl overflow-y-auto no-scrollbar pb-32"
        >
          {/* ── HEADER ── */}
          <div className="px-6 pt-16 pb-6 flex flex-col gap-10">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-[32px] font-bold text-slate-900 tracking-tight">Discovery</h2>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Institutional Directory</p>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* ── SEARCH INPUT ── */}
            <div className="relative group">
              <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search items, nodes, or news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-16 bg-slate-50 rounded-3xl pl-16 pr-6 font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 border border-slate-100 focus:border-slate-200 transition-all text-[16px] placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* ── SEARCH RESULTS / DISCOVERY ── */}
          <div className="px-6 mt-8">
            <AnimatePresence mode="wait">
              {query.trim() ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Search Results</h3>
                  {filteredResults.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-4xl border border-dashed border-slate-200">
                       <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">No matching assets found</p>
                    </div>
                  ) : filteredResults.map((item, i) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        onClose();
                        router.push(`/marketplace/${item.id}`);
                      }}
                      className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center gap-4 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-slate-200/50"
                    >
                       <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                          {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                       </div>
                       <div className="flex-1">
                          <p className="text-[15px] font-bold text-slate-900 tracking-tight leading-none mb-1">{item.title}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase">RM {item.price}</span>
                             <span className="w-1 h-1 bg-slate-200 rounded-full" />
                             <span className="text-[10px] font-bold text-slate-400">{item.seller_name}</span>
                          </div>
                       </div>
                       <ArrowRight size={18} className="text-slate-200" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="discovery"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {/* Registry Categories */}
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Marketplace Hub</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {itemCategories.map((cat, i) => (
                        <button key={i} className="w-full h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-between px-6 hover:bg-slate-50 transition-all group shadow-sm shadow-slate-200/50">
                          <div className="flex items-center gap-5">
                            <div className={`w-11 h-11 rounded-2xl ${cat.bg} flex items-center justify-center border border-white/20`}>
                              <cat.icon size={22} strokeWidth={2.2} className={cat.color} />
                            </div>
                            <span className="font-bold text-[15px] text-slate-900 tracking-tight">{cat.label}</span>
                          </div>
                          <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900" />
                        </button>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

