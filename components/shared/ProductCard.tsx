'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

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
    stock_count?: number;
  };
  onClick?: () => void;
}

export default function ProductCard({ item, onClick }: ProductCardProps) {
  const isSold = item.status === 'SOLD' || (item.stock_count !== undefined && item.stock_count !== null && item.stock_count <= 0);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col cursor-pointer group"
    >
      {/* ── IMAGE BOX ── */}
      <div className="relative aspect-4/5 bg-slate-50 rounded-[22px] overflow-hidden mb-4 border-[0.5px] border-slate-100 transition-all group-hover:border-slate-200">
        <motion.img 
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/400`} 
          className={`w-full h-full object-cover transition-all ${isSold ? 'blur-[1px] grayscale opacity-50' : ''}`}
          loading="lazy"
        />
        
        {item.is_official && (
          <div className="absolute top-3 left-3">
            <div className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg border-[0.5px] border-slate-100">
              <p className="text-[8px] font-bold text-[#1e293b] uppercase tracking-[0.15em]">Official</p>
            </div>
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <p className="text-[9px] font-bold text-white uppercase tracking-[0.2em] bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              {item.status === 'SOLD' ? 'Sold' : 'Out of Stock'}
            </p>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="px-1 space-y-2">
        <h4 className="text-[13px] font-semibold text-slate-900 tracking-tight leading-snug line-clamp-2">
          {item.title}
        </h4>

        {/* ── SELLER (if available) ── */}
        {item.seller_name && (
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            {item.seller_name}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-[16px] font-black text-[#1e293b] tracking-tighter">
            RM {Number(item.price || 0).toFixed(0)}
          </p>
          <div className="w-7 h-7 rounded-full bg-slate-50 border-[0.5px] border-slate-200 flex items-center justify-center group-hover:bg-[#1e293b] group-hover:border-[#1e293b] transition-all duration-300">
            <ArrowUpRight size={13} className="text-slate-400 group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
