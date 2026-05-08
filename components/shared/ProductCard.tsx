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
    subtitle?: string;
    time_ago?: string;
    is_official?: boolean;
    status?: string;
    badge?: string;
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
      <div className="relative aspect-square bg-slate-50 rounded-[10px] overflow-hidden mb-3 border border-slate-50 shadow-sm shadow-slate-200/20 group-hover:shadow-md transition-shadow">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/500`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-60' : ''}`}
          loading="lazy"
        />
        
        {item.is_official && (
          <div className="absolute top-4 left-4 flex gap-1">
             <div className="w-2 h-2 bg-[#00D09C] rounded-full shadow-sm" />
             <div className="w-2 h-2 bg-[#00D09C]/40 rounded-full shadow-sm" />
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-1.5 space-y-2">
        {/* Row 1: Title & Time */}
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-[13px] font-bold text-slate-900 tracking-[-0.02em] leading-tight flex-1">
            {item.title}
          </h4>
          <span className="text-[11px] font-medium text-slate-300 tracking-tight shrink-0">
            {item.time_ago || '2d'}
          </span>
        </div>

        {/* Row 2: Price & Seller */}
        <div className="flex items-center justify-between gap-3">
           {isSold ? (
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest line-through">SOLD</span>
           ) : (
              <p className="text-[16px] font-bold text-slate-900 tracking-[-0.03em]">
                RM{Number(item.price || 0).toFixed(0)}
              </p>
           )}

           <div className="flex items-center gap-2 max-w-[60%]">
              <span className="text-[10px] font-bold text-slate-400 tracking-tight line-clamp-1 text-right">
                {item.seller_name || 'Pulse Resident'}
              </span>
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-white overflow-hidden shrink-0 shadow-sm">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller_name || 'Pulse'}`} 
                  className="w-full h-full object-cover" 
                />
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
