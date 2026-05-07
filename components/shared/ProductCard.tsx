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
      <div className="relative aspect-4/5 bg-slate-50 rounded-[24px] overflow-hidden mb-3 border border-slate-50 shadow-sm shadow-slate-200/20 group-hover:shadow-md transition-shadow">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/500`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-60' : ''}`}
          loading="lazy"
        />
        
        {item.is_official && (
          <div className="absolute top-4 left-4 px-2.5 py-1.5 bg-white/90 backdrop-blur-xl rounded-xl flex items-center gap-2 border border-white/50 shadow-sm">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Official</span>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-1.5 space-y-1.5">
        <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-[1.2] line-clamp-1">
          {item.title}
        </h4>

        <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.seller_name || 'Pulse Resident'}</span>
           {isSold ? (
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest line-through">SOLD</span>
           ) : (
              <p className="text-[16px] font-black text-slate-900 tracking-tighter">
                RM{Number(item.price || 0).toFixed(0)}
              </p>
           )}
        </div>
      </div>
    </motion.div>
  );
}
