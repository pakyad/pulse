"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, FileText, BarChart3, CreditCard } from 'lucide-react';

const mockSales = [
  { id: 'SAL-9920', merchant: 'Engineering Hub Cafe', amount: 'RM 1,240.50', fee: 'RM 124.05', date: '14:22' },
  { id: 'SAL-9915', merchant: 'MIIT Student Society', amount: 'RM 450.00', fee: 'RM 45.00', date: '11:05' },
  { id: 'SAL-9910', merchant: 'UBIS Academic Supplies', amount: 'RM 89.20', fee: 'RM 8.92', date: 'Yesterday' },
];

export default function TreasuryView() {
  return (
    <div className="space-y-12">
      {/* Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-12 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                  <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase">Total System Sales</p>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100/50">
                  <TrendingUp size={12} />
                  +4.2%
               </div>
            </div>
            <div className="flex items-baseline gap-4">
              <h2 className="text-[52px] font-bold tracking-widest text-[#0A0F1E]">RM 14,802.42</h2>
              <span className="text-slate-200 text-sm font-bold tracking-widest uppercase">Direct Sales</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mt-16 border-t border-slate-50 pt-12">
             <div className="space-y-2">
                <p className="text-slate-300 text-[9px] font-bold tracking-[0.2em] uppercase">Total Fees Collected (10%)</p>
                <p className="text-[22px] font-bold text-[#007AFF] tracking-tight">RM 1,480.24</p>
             </div>
             <div className="space-y-2">
                <p className="text-slate-300 text-[9px] font-bold tracking-[0.2em] uppercase">Today's Transactions</p>
                <p className="text-[22px] font-bold text-[#0A0F1E] tracking-tight">142 Orders</p>
             </div>
          </div>
        </div>

        <div className="bg-[#0A0F1E] rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-2xl shadow-navy/10">
           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-10">
              <BarChart3 size={28} className="text-[#007AFF]" />
           </div>
           <h4 className="text-white font-bold text-lg tracking-widest mb-3">Sales Stats</h4>
           <p className="text-white/30 text-[13px] leading-relaxed mb-10 px-4 font-medium">View detailed reports on which clubs and merchants are making the most sales.</p>
           <button className="mt-auto w-full bg-[#007AFF] text-white font-bold text-[10px] py-5 rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 active:scale-95">
             Open Reports
           </button>
        </div>
      </div>

      {/* Sales Log */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-[#007AFF]" />
            <h3 className="text-[#0A0F1E] font-bold text-sm tracking-widest uppercase opacity-80">Recent Sales Log</h3>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[9px] font-bold text-[#007AFF] uppercase tracking-widest border border-blue-100/50">
            <div className="w-1 h-1 rounded-full bg-[#007AFF] animate-pulse" />
            Direct Tracking
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/10">
                <th className="px-10 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sale ID</th>
                <th className="px-10 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Merchant</th>
                <th className="px-10 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-right">Total (RM)</th>
                <th className="px-10 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-right">Fee (10%)</th>
                <th className="px-10 py-5 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-10 py-7 font-mono text-[10px] text-slate-300 tracking-wider">{sale.id}</td>
                  <td className="px-10 py-7">
                    <p className="text-[#0A0F1E] font-bold text-[14px] leading-none mb-1.5">{sale.merchant}</p>
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Direct Sale</p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <p className="text-[16px] font-bold text-[#0A0F1E] tracking-tight">{sale.amount}</p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <p className="text-[14px] font-bold text-[#007AFF] tracking-tight">{sale.fee}</p>
                  </td>
                  <td className="px-10 py-7 text-right text-slate-400 text-[11px] font-medium">
                    {sale.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
