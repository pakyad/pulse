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
      <div className="relative aspect-square bg-[#FDFDFD] rounded-[8px] overflow-hidden mb-3 border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/400`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-60' : ''}`}
          loading="lazy"
          onError={(e: any) => {
            e.target.src = `https://picsum.photos/seed/${item.title}/400/400`;
            e.target.onerror = null;
          }}
        />
        
        {item.is_official && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/95 backdrop-blur-md rounded-md flex items-center gap-1 border border-[#E5E5E5] shadow-sm">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm animate-pulse" />
             <span className="text-[7.5px] font-black text-navy uppercase tracking-widest">Official</span>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-0.5 space-y-2">
        {/* Row 1: Title & Time */}
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-[13px] font-bold text-navy leading-tight line-clamp-1 flex-1 tracking-tight">
            {item.title}
          </h4>
          <span className="text-[9px] font-bold text-[#B1B1B1] shrink-0 mt-0.5">
            {item.time_ago || '3h ago'}
          </span>
        </div>

        {/* Row 2: Seller/Subtitle & Price/Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
              <img 
                src={item.seller_name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller_name}` : `https://api.dicebear.com/7.x/shapes/svg?seed=${item.subtitle}`} 
                className="w-full h-full object-cover opacity-80" 
              />
            </div>
            <span className="text-[10px] font-medium text-[#8E8E93] truncate">
              {item.seller_name || item.subtitle || 'Pulse Resident'}
            </span>
          </div>
          
          <div className="shrink-0 text-right">
            {isSold ? (
              <span className="text-[9px] font-black text-[#B1B1B1] uppercase tracking-widest line-through">SOLD</span>
            ) : item.price !== undefined ? (
              <p className="text-[15px] font-black text-navy tracking-tight whitespace-nowrap">
                RM {Number(item.price).toLocaleString()}
              </p>
            ) : item.badge ? (
              <div className="px-1.5 py-0.5 bg-white border border-[#E5E5E5] rounded-sm">
                 <span className="text-[7.5px] font-black text-navy uppercase tracking-widest">{item.badge}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
