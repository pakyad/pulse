'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, ShoppingBag, Utensils, Box, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Box },
  { id: 'Transport', label: 'Logistics', icon: Car },
  { id: 'Food', label: 'Food', icon: Utensils },
  { id: 'Market', label: 'Market', icon: ShoppingBag },
];

const HISTORY_DATA = [
  {
    id: 'h1',
    title: 'Hentian Duta to PV18 Residences',
    category: 'Transport',
    price: 15.00,
    date: '30 Mar 2026, 04:07 AM',
    icon: Car,
    color: 'bg-emerald-500'
  },
  {
    id: 'h2',
    title: 'PV18 Residences to Hentian Duta',
    category: 'Transport',
    price: 22.00,
    date: '14 Mar 2026, 10:46 AM',
    icon: Car,
    color: 'bg-emerald-500'
  },
  {
    id: 'h3',
    title: 'Chicken Chop / Black Pepper',
    category: 'Food',
    price: 12.00,
    date: '10 Mar 2026, 01:20 PM',
    icon: Utensils,
    color: 'bg-orange-500'
  },
  {
    id: 'h4',
    title: 'Pulse Tech Hoodie (L)',
    category: 'Market',
    price: 85.00,
    date: '02 Mar 2026, 11:15 AM',
    icon: ShoppingBag,
    color: 'bg-purple-500'
  },
  {
    id: 'h5',
    title: 'UniKL MIIT to Starbucks Node',
    category: 'Transport',
    price: 5.00,
    date: '28 Feb 2026, 03:30 PM',
    icon: Car,
    color: 'bg-emerald-500'
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
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#F2F2F7] px-6 pt-12 pb-4 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-1 -ml-1 text-navy hover:text-navy/60 transition-all active:scale-90"
        >
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold text-black tracking-tight">Order History</h1>
      </nav>

      {/* ── CATEGORY PILLS ── */}
      <section className="px-6 py-5 overflow-x-auto no-scrollbar flex gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all border ${
              activeTab === cat.id 
                ? 'bg-[#0A2A2A] text-white border-[#0A2A2A]' 
                : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* ── HISTORY LIST ── */}
      <section className="px-6 space-y-8 pt-4 pb-32">
        {filteredHistory.map((item) => (
          <div key={item.id} className="flex gap-4">
            {/* Left Icon Block */}
            <div className="relative shrink-0">
               <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-[#F2F2F7] relative">
                  <item.icon size={24} className="text-navy opacity-80" strokeWidth={1.5} />
                  <div className={`absolute -top-1 -left-1 w-6 h-6 ${item.color} rounded-full flex items-center justify-center border-2 border-white text-white`}>
                     <Box size={10} strokeWidth={3} />
                  </div>
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-1">
                  <h3 className="text-[15px] font-bold text-black leading-tight line-clamp-2 pr-4">{item.title}</h3>
                  <span className="text-[14px] font-black text-navy whitespace-nowrap">RM {item.price.toFixed(2)}</span>
               </div>
               <p className="text-[12px] text-slate-400 font-medium mb-3">{item.date}</p>
               
               <button className="flex items-center gap-1 text-[13px] font-bold text-[#007AFF] hover:opacity-70 transition-opacity">
                  Rebook <ChevronRight size={14} strokeWidth={2.5} />
               </button>
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <p className="text-[15px] font-bold text-navy/20">No history in this category.</p>
          </div>
        )}
      </section>

    </motion.main>
  );
}
