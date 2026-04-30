'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, ShoppingBag, Utensils, Box, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Box },
  { id: 'Logistics', label: 'Logistics', icon: Box },
  { id: 'PulseHub', label: 'Pulse Hub', icon: Box },
  { id: 'Market', label: 'Market', icon: ShoppingBag },
];

const HISTORY_DATA = [
  {
    id: 'h1',
    title: 'Parcel Pickup from Lvl 2 MIIT',
    category: 'Logistics',
    price: 5.00,
    date: '30 Apr 2026, 04:07 PM',
    icon: Box,
    color: 'bg-blue-500'
  },
  {
    id: 'h2',
    title: 'MIIT Society Drop: 2026 Varsity Jersey',
    category: 'Market',
    price: 85.00,
    date: '28 Apr 2026, 10:46 AM',
    icon: ShoppingBag,
    color: 'bg-purple-500'
  },
  {
    id: 'h3',
    title: 'Exam Prep Seminar: Discrete Math',
    category: 'PulseHub',
    price: 15.00,
    date: '25 Apr 2026, 02:00 PM',
    icon: Box,
    color: 'bg-emerald-500'
  },
  {
    id: 'h4',
    title: 'Study Note Pack: Calculus IV',
    category: 'Market',
    price: 12.00,
    date: '20 Apr 2026, 11:15 AM',
    icon: ShoppingBag,
    color: 'bg-purple-500'
  },
  {
    id: 'h5',
    title: 'Inter-Campus Document Courier',
    category: 'Logistics',
    price: 8.00,
    date: '15 Apr 2026, 03:30 PM',
    icon: Box,
    color: 'bg-blue-500'
  }
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');

  const filteredHistory = HISTORY_DATA.filter(item => 
    activeTab === 'All' || item.category === activeTab
  );

  return (
    <motion.main 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="min-h-screen bg-white font-sans antialiased text-navy max-w-md mx-auto border-x border-[#F2F2F7]"
    >
      
      {/* ── HEADER ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#F2F2F7] px-8 pt-16 pb-6 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-navy/40 hover:text-navy transition-all active:scale-90 border border-[#F2F2F7]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight text-navy">Order History</h1>
      </nav>

      {/* ── CATEGORY PILLS ── */}
      <section className="px-6 py-6 overflow-x-auto no-scrollbar flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-[8px] text-[12px] font-bold transition-all border ${
              activeTab === cat.id 
                ? 'bg-black text-white border-black shadow-[0_2px_8px_rgba(0,0,0,0.1)]' 
                : 'bg-white text-slate-400 border-[#F2F2F7] hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* ── HISTORY LIST ── */}
      <section className="px-6 space-y-6 pt-2 pb-32">
        {filteredHistory.map((item) => (
          <div key={item.id} className="flex gap-4 items-center">
            {/* Left Icon Block */}
            <div className="relative shrink-0">
               <div className="w-12 h-12 rounded-[8px] bg-[#FDFDFD] flex items-center justify-center border border-[#F2F2F7] shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative">
                  <item.icon size={20} className="text-black opacity-80" strokeWidth={1.5} />
                  <div className={`absolute -top-1 -right-1 w-4 h-4 ${item.color} rounded-full border-2 border-white shadow-sm`} />
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-[13px] font-bold text-black leading-tight truncate pr-4">{item.title}</h3>
                  <span className="text-[13px] font-black text-black whitespace-nowrap">RM{item.price.toFixed(2)}</span>
               </div>
               <p className="text-[11px] text-slate-400 font-medium tracking-tight uppercase mb-2">{item.date}</p>
               
               <button className="flex items-center gap-1 text-[11px] font-black text-[#0A66C2] hover:opacity-70 transition-opacity uppercase tracking-widest">
                  View Status <ChevronRight size={10} strokeWidth={3} />
               </button>
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <p className="text-[13px] font-bold text-navy/10 uppercase tracking-widest">No history found.</p>
          </div>
        )}
      </section>

    </motion.main>
  );
}
