"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, FileText, BarChart3, CreditCard } from 'lucide-react';

const mockSales = [
  { id: 'SAL-9920', merchant: 'Engineering Hub Cafe', amount: '1,240.50', fee: '124.05', date: '14:22' },
  { id: 'SAL-9915', merchant: 'MIIT Student Society', amount: '450.00', fee: '45.00', date: '11:05' },
  { id: 'SAL-9910', merchant: 'UBIS Academic Supplies', amount: '89.20', fee: '8.92', date: 'Yesterday' },
];

export default function TreasuryView() {
  return (
    <div className="space-y-12">
      {/* Sales Overview (Institutional Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px] p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-16">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00927C]" />
                  <p className="text-black/20 text-[10px] font-black tracking-[0.4em] uppercase">Total System Revenue</p>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00927C]/5 text-[#00927C] text-[10px] font-black border-[0.5px] border-[#00927C]/10 uppercase tracking-widest">
                  <TrendingUp size={12} strokeWidth={3} />
                  +4.2% Kinetic Growth
               </div>
            </div>
            <div className="flex items-baseline gap-6">
              <h2 className="text-[56px] font-black tracking-tighter text-black leading-none uppercase">RM 14,802.42</h2>
              <span className="text-black/10 text-[12px] font-black tracking-[0.3em] uppercase italic">Settled Direct</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mt-20 border-t-[0.5px] border-[#F2F2F7] pt-12">
             <div className="space-y-2">
                <p className="text-black/20 text-[9px] font-black tracking-[0.3em] uppercase">Commission Engine (10%)</p>
                <p className="text-[28px] font-black text-[#00927C] tracking-tighter uppercase">RM 1,480.24</p>
             </div>
             <div className="space-y-2">
                <p className="text-black/20 text-[9px] font-black tracking-[0.3em] uppercase">Active Throughput (24h)</p>
                <p className="text-[28px] font-black text-black tracking-tighter uppercase">142 Orders</p>
             </div>
          </div>
        </div>

        {/* Global Analytics Bridge */}
        <div className="bg-black rounded-[22px] p-10 flex flex-col items-center text-center border-[0.5px] border-white/10 shadow-2xl shadow-black/20">
           <div className="w-16 h-16 rounded-[16px] bg-white/5 border border-white/5 flex items-center justify-center mb-10">
              <BarChart3 size={32} className="text-[#00927C]" />
           </div>
           <h4 className="text-white font-black text-xl uppercase tracking-tighter mb-4">Strategic Analytics</h4>
           <p className="text-white/20 text-[12px] font-medium leading-relaxed mb-12 px-6 uppercase tracking-wide">
             High-density telemetry of merchant velocity and campus contribution metrics.
           </p>
           <button className="mt-auto w-full bg-white text-black font-black text-[11px] h-16 rounded-[16px] hover:bg-white/90 transition-all uppercase tracking-[0.3em]">
             Review Registry
           </button>
        </div>
      </div>

      {/* Transaction Log (Optical Registry) */}
      <div className="bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px] overflow-hidden shadow-sm">
        <div className="px-10 py-8 border-b-[0.5px] border-[#F2F2F7] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CreditCard size={18} className="text-[#00927C]" />
            <h3 className="text-black font-black text-[12px] tracking-[0.3em] uppercase">Authorized Sales Stream</h3>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-black/5 text-[9px] font-black text-black/40 uppercase tracking-[0.3em]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00927C] animate-pulse" />
            Live Sync
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[0.5px] border-[#F2F2F7] bg-slate-50/10">
                <th className="px-10 py-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em]">Index ID</th>
                <th className="px-10 py-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em]">Merchant Node</th>
                <th className="px-10 py-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em] text-right">Value (RM)</th>
                <th className="px-10 py-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em] text-right">Tax Fee</th>
                <th className="px-10 py-6 text-[9px] font-black text-black/20 uppercase tracking-[0.4em] text-right">Temporal</th>
              </tr>
            </thead>
            <tbody className="divide-y-[0.5px] divide-[#F2F2F7]">
              {mockSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-black/[0.01] transition-all group">
                  <td className="px-10 py-8 font-mono text-[11px] text-black/20 tracking-wider">#{sale.id}</td>
                  <td className="px-10 py-8">
                    <p className="text-black font-black text-[15px] leading-none mb-2 uppercase tracking-tight">{sale.merchant}</p>
                    <p className="text-black/20 text-[10px] font-black uppercase tracking-widest italic">Validated Transaction</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <p className="text-[18px] font-black text-black tracking-tight">{sale.amount}</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <p className="text-[15px] font-black text-[#00927C] tracking-tight">{sale.fee}</p>
                  </td>
                  <td className="px-10 py-8 text-right text-black/30 text-[11px] font-bold uppercase tracking-widest">
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
