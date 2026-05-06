'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

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
      <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-3 border border-slate-100 shadow-sm shadow-slate-200/5 group-hover:shadow-md transition-shadow">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/400`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-60' : ''}`}
          loading="lazy"
        />
        
        {item.is_official && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-xl rounded-xl flex items-center gap-1.5 border border-white/50 shadow-sm shadow-black/5">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm" />
             <span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">Official</span>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-1 space-y-1.5">
        {/* Row 1: Title & Time */}
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-1 flex-1 tracking-tight">
            {item.title}
          </h4>
          <span className="text-[10px] font-semibold text-slate-400 shrink-0 mt-0.5 uppercase tracking-widest">
            {item.time_ago || '3h ago'}
          </span>
        </div>

        {/* Row 2: Seller/Subtitle & Price/Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="w-5 h-5 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
              <img 
                src={item.seller_name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller_name}` : `https://api.dicebear.com/7.x/shapes/svg?seed=${item.subtitle}`} 
                className="w-full h-full object-cover opacity-90" 
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              {item.seller_name || item.subtitle || 'Pulse Resident'}
            </span>
          </div>
          
          <div className="shrink-0 text-right">
            {isSold ? (
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest line-through">SOLD</span>
            ) : item.price !== undefined ? (
              <p className="text-[16px] font-bold text-slate-900 tracking-tight whitespace-nowrap">
                RM {Number(item.price).toLocaleString()}
              </p>
            ) : item.badge ? (
              <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                 <span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">{item.badge}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
