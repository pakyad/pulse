'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Smartphone, 
  BookOpen, 
  Truck, 
  Newspaper, 
  Zap, 
  GraduationCap, 
  Users,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  const itemCategories = [
    { label: 'Marketplace Assets', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Campus Logistics', icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Registry Archive', icon: Newspaper, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Node Operations', icon: Smartphone, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const discoveryNodes = [
    { label: 'Ledger Updates', icon: Newspaper, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Terminal Sync', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Academic Heart', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Social Registry', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-3xl overflow-y-auto no-scrollbar pb-32"
        >
          {/* Header Area */}
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

            {/* Premium Search Input */}
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

          {/* Registry Categories */}
          <section className="px-6 mt-12">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Marketplace Hub</h3>
            <div className="grid grid-cols-1 gap-3">
              {itemCategories.map((cat, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="w-full h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-between px-6 hover:bg-slate-50 transition-all group shadow-sm shadow-slate-200/50"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 rounded-2xl ${cat.bg} flex items-center justify-center border border-white/20`}>
                      <cat.icon size={22} strokeWidth={2.2} className={cat.color} />
                    </div>
                    <span className="font-bold text-[15px] text-slate-900 group-hover:text-slate-900 transition-colors tracking-tight">{cat.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Pulse Radar Nodes */}
          <section className="px-6 mt-16">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">Pulse Radar</h3>
            <div className="grid grid-cols-2 gap-4">
              {discoveryNodes.map((cat, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:bg-slate-50 transition-all group shadow-sm shadow-slate-200/50"
                >
                  <div className={`w-14 h-14 rounded-3xl ${cat.bg} flex items-center justify-center shadow-inner`}>
                    <cat.icon size={26} strokeWidth={2} className={cat.color} />
                  </div>
                  <span className="font-bold text-[13px] text-slate-900 text-center leading-tight group-hover:text-slate-900 transition-colors tracking-tight">{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Global Asset Interrupter */}
          <section className="mt-20 pb-12">
            <div className="px-6 mb-8 flex justify-between items-baseline">
              <h3 className="text-[20px] font-bold text-slate-900 tracking-tight">Latest Discoveries</h3>
              <p className="text-[12px] font-bold text-accent uppercase tracking-widest">Explore all</p>
            </div>
            <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar snap-x">
               {[1, 2, 3, 4].map((item) => (
                 <div key={item} className="w-[200px] shrink-0 snap-start group cursor-pointer">
                    <div className="aspect-[3/4] bg-slate-50 rounded-4xl overflow-hidden mb-4 p-5 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-100">
                       <img src={`https://picsum.photos/seed/${item}/400/500`} className="w-[90%] h-[90%] object-cover rounded-3xl shadow-2xl shadow-slate-900/10 transition-transform duration-500 group-hover:scale-105" alt=""/>
                    </div>
                    <p className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-1 tracking-tight">Institutional Asset {item}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Registry Feature</p>
                 </div>
               ))}
            </div>
          </section>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
