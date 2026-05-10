"use client";

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface PriceAuditProps {
  items: any[];
  guidelines: Record<string, number>;
  onReview: (item: any) => void;
  onOpenPolicy: () => void;
}

export default function PriceAudit({ items, guidelines, onReview, onOpenPolicy }: PriceAuditProps) {
  // 1. Calculate Category Averages for Spike Detection (UC_1801)
  const categoryStats: Record<string, { total: number, count: number }> = {};
  items.forEach(i => {
    if (!categoryStats[i.category]) categoryStats[i.category] = { total: 0, count: 0 };
    categoryStats[i.category].total += Number(i.price || 0);
    categoryStats[i.category].count += 1;
  });

  const categoryAverages: Record<string, number> = {};
  Object.keys(categoryStats).forEach(cat => {
    categoryAverages[cat] = categoryStats[cat].total / categoryStats[cat].count;
  });

  // 2. Automated Flagging Logic (Ceiling OR Spike)
  const flagged = items.filter(i => {
    const ceiling = guidelines[i.category] || 9999;
    const avg = categoryAverages[i.category] || i.price;
    const isOverCeiling = i.price > ceiling;
    const isPriceSpike = i.price > avg * 1.5 && i.price > 10; // Only spike flag if above RM10 to avoid noise
    return isOverCeiling || isPriceSpike;
  });
  
  return (
    <div className="space-y-12">
      {/* TASK 1: RAW STATS */}
      <div className="flex gap-12 border-b border-slate-100 pb-8">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Flagged Assets</p>
          <p className="text-[32px] font-black text-slate-900 leading-none">{flagged.length}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Limits</p>
          <p className="text-[32px] font-black text-slate-900 leading-none">{Object.keys(guidelines).length}</p>
        </div>
        <div className="ml-auto flex items-end">
          <button 
            onClick={onOpenPolicy}
            className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            Create Policy
          </button>
        </div>
      </div>

      {/* TASK 2: AUDIT LEDGER */}
      <section>
        <div className="grid grid-cols-12 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Merchant</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Price</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ceiling</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y-[0.5px] divide-slate-200">
          {flagged.length > 0 ? flagged.map((item) => (
            <div key={item.id} className="grid grid-cols-12 px-4 py-5 items-center hover:bg-slate-50/30 transition-colors">
              <div className="col-span-5">
                <p className="text-[14px] font-bold text-slate-900 leading-tight">{item.title}</p>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{item.seller_name || 'Registry Vendor'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">{item.category}</span>
              </div>
              <div className="col-span-2 text-[14px] font-black flex flex-col">
                <span className={item.price > (guidelines[item.category] || 9999) ? 'text-red-500' : 'text-orange-500'}>
                  RM {Number(item.price).toFixed(2)}
                </span>
                {item.price > (categoryAverages[item.category] * 1.5) && (
                  <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-1">Spike Warning</span>
                )}
              </div>
              <div className="col-span-2 text-[14px] font-bold text-emerald-600">
                RM {(guidelines[item.category] || 0).toFixed(2)}
              </div>
              <div className="col-span-1 text-right">
                <button 
                  onClick={() => onReview(item)}
                  className="h-8 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  REVIEW
                </button>
              </div>
            </div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center">
              <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Audit Registry Stable</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
