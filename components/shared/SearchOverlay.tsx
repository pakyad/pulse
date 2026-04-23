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
  ChevronRight
} from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  const itemCategories = [
    { label: 'Tech & Terminal', icon: Smartphone, color: 'bg-blue-50 text-blue-600' },
    { label: 'Varsity Apparel', icon: ShoppingBag, color: 'bg-rose-50 text-rose-600' },
    { label: 'Academic Resources', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Campus Logistics', icon: Truck, color: 'bg-amber-50 text-amber-600' },
  ];

  const newsCategories = [
    { label: 'Official Ledger', icon: Newspaper, color: 'bg-slate-50 text-navy' },
    { label: 'Innovation Sync', icon: Zap, color: 'bg-violet-50 text-violet-600' },
    { label: 'Academic Heartbeat', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Student Insights', icon: Users, color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-white overflow-y-auto no-scrollbar pb-32"
        >
          {/* Header */}
          <div className="px-6 pt-12 pb-6 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h2 className="text-[36px] font-bold tracking-tight text-navy">Search</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-navy transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative group">
              <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-navy transition-colors" />
              <input 
                autoFocus
                type="text" 
                placeholder="Titles, items, or campus news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-[64px] bg-slate-50 rounded-2xl pl-16 pr-6 font-bold text-navy outline-none focus:bg-white focus:ring-4 focus:ring-navy/5 border border-transparent focus:border-navy/10 transition-all text-[16px]"
              />
            </div>
          </div>

          {/* Categories: Items */}
          <section className="px-6 mt-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6">Marketplace Hub</h3>
            <div className="grid grid-cols-1 gap-3">
              {itemCategories.map((cat, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full h-[72px] bg-white border border-slate-100 rounded-2xl flex items-center justify-between px-6 hover:bg-slate-50 transition-all hover:translate-x-1 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                      <cat.icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className="font-bold text-[15px] text-navy group-hover:text-accent transition-colors">{cat.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-200" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Categories: News */}
          <section className="px-6 mt-12">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-300 mb-6">Pulse Radar</h3>
            <div className="grid grid-cols-2 gap-3">
              {newsCategories.map((cat, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex flex-col items-center justify-center gap-4 p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:bg-slate-50 transition-all hover:-translate-y-1 group"
                >
                  <div className={`w-12 h-12 rounded-full ${cat.color} flex items-center justify-center shadow-inner`}>
                    <cat.icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-[12px] text-navy text-center leading-tight group-hover:text-accent transition-colors">{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trending/Latest Section */}
          <section className="mt-16 pb-12">
            <div className="px-6 mb-6 flex justify-between items-end">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Latest Discoveries</h3>
              <p className="text-[12px] font-bold text-accent">View all</p>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar snap-x">
               {[1, 2, 3, 4].map((item) => (
                 <div key={item} className="w-[180px] flex-shrink-0 snap-start group cursor-pointer">
                    <div className="aspect-[3/4] bg-slate-50 rounded-[2rem] overflow-hidden mb-4 p-4 border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                       <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&h=400&fit=crop" className="w-[85%] h-[85%] object-cover rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-105" alt=""/>
                    </div>
                    <p className="text-[14px] font-bold text-navy leading-tight line-clamp-1">Campus Tech Unbox</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Official Feature</p>
                 </div>
               ))}
            </div>
          </section>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
