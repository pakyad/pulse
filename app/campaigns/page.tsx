'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Ticket, ChevronLeft, Gift, Clock, Sparkles } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

export default function CampaignsPage() {
  const router = useRouter();

  const campaigns = [
    {
      id: 1,
      title: 'Free Runner Delivery',
      merchant: 'Pulse Logistics',
      validUntil: 'Valid until June 30',
      code: 'FREERUN',
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      bgLight: 'bg-amber-50',
      icon: <Ticket size={24} className="text-white" />
    },
    {
      id: 2,
      title: 'RM5 Off UniStore',
      merchant: 'UniStore Official',
      validUntil: 'Valid until July 15',
      code: 'UNIKL5',
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      icon: <Gift size={24} className="text-white" />
    },
    {
      id: 3,
      title: '15% Off All Meals',
      merchant: 'Cafe Kenanga',
      validUntil: 'Valid until June 10',
      code: 'KENANGA15',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      bgLight: 'bg-emerald-50',
      icon: <Sparkles size={24} className="text-white" />
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-24 font-sans antialiased">
      
      {/* ── HEADER ── */}
      <nav className="sticky top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-4">
          <BackButton fallback="/marketplace" />
          <div>
            <p className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">Vouchers & Campaigns</p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">3 active offers</p>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* ── HERO BANNER ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[140px] rounded-3xl overflow-hidden bg-slate-900 mb-8 shadow-xl shadow-slate-200"
        >
          <div className="absolute inset-0 bg-linear-to-r from-rose-500 to-orange-500 opacity-90" />
          
          <div className="absolute inset-0 p-6 flex flex-col justify-center z-10">
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Student Perks</span>
            <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">Claim Your<br/>Discounts</h2>
          </div>
          
          <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12">
            <Ticket size={160} strokeWidth={1} className="text-white" />
          </div>
        </motion.div>

        {/* ── CAMPAIGN LIST ── */}
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-slate-900 px-1 mb-2 tracking-tight">Available For You</h3>
          
          {campaigns.map((camp, index) => (
            <motion.div 
              key={camp.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
            >
              {/* Left Color Block */}
              <div className={`w-[80px] shrink-0 ${camp.color} flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full translate-y-1/2 translate-x-1/2" />
                <div className="z-10 group-hover:scale-110 transition-transform duration-300">
                  {camp.icon}
                </div>
              </div>
              
              {/* Right Content Block */}
              <div className="flex-1 p-4 flex flex-col justify-center relative">
                {/* Perforated edge effect */}
                <div className="absolute left-0 top-2 bottom-2 w-px border-l-2 border-dashed border-slate-200" />
                
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 pl-2">{camp.merchant}</p>
                <h4 className="text-[16px] font-black text-slate-900 leading-tight mb-2 pl-2">{camp.title}</h4>
                
                <div className="flex items-center gap-1.5 pl-2">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-400">{camp.validUntil}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pr-4 flex items-center justify-center border-l border-slate-50 pl-4">
                <button className={`px-4 py-2 rounded-xl ${camp.bgLight} ${camp.textColor} text-[12px] font-bold tracking-tight active:scale-95 transition-transform`}>
                  Claim
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
