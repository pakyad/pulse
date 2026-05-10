'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface ProductCardProps {
  item: {
    id: string | number;
    title: string;
    price?: number;
    image_url: string;
    seller_name?: string;
    time_ago?: string;
    is_official?: boolean;
    status?: string;
  };
  onClick?: () => void;
}

export default function ProductCard({ item, onClick }: ProductCardProps) {
  const isSold = item.status === 'SOLD';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col cursor-pointer group"
    >
      {/* ── IMAGE BOX ── */}
      <div className="relative aspect-4/5 bg-slate-50 rounded-xl overflow-hidden mb-4 border border-slate-100 shadow-sm transition-all group-hover:border-slate-300">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/400`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-60' : ''}`}
          loading="lazy"
        />
        
        {item.is_official && (
          <div className="absolute top-4 left-4">
             <div className="px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-100">
                <p className="text-[8px] font-bold text-[#1e293b] uppercase tracking-widest">Official</p>
             </div>
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
             <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em] bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20">Sold</p>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-1 space-y-3">
        <h4 className="text-[14px] font-medium text-slate-900 tracking-tight leading-snug">
          {item.title}
        </h4>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="w-2.5 h-2.5 bg-emerald-500 rounded-[2px]" />
          ))}
          <span className="text-[10px] font-bold text-slate-300 ml-1">(121)</span>
        </div>

        <div className="flex items-center justify-between pt-1">
           <p className="text-[16px] font-black text-slate-900 tracking-tighter">
             RM {Number(item.price || 0).toFixed(0)}
           </p>
           <div className="h-8 px-4 border border-slate-200 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">View</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
