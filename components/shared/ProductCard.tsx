'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

interface ProductCardProps {
  item: {
    id: string | number;
    title: string;
    price?: number;
    image_url: string;
    seller_name?: string;
    seller_photo_url?: string;
    time_ago?: string;
    is_official?: boolean;
    status?: string;
    stock_count?: number;
    category?: string;
    subcategory?: string;
  };
  onClick?: () => void;
}

export default function ProductCard({ item, onClick }: ProductCardProps) {
  const isSold = item.status === 'SOLD' || (item.stock_count !== undefined && item.stock_count !== null && item.stock_count <= 0);

  // Mocking timeAgo if not provided by DB for the demo view
  const timeAgo = item.time_ago || "Just now";
  
  // Format price safely
  const formattedPrice = item.price !== undefined ? Number(item.price).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';

  // Check if item is under price governance
  let isGoverned = false;
  if (item.category && item.subcategory) {
    const catConfig = MARKETPLACE_CATEGORIES[item.category as CategoryID];
    if (catConfig) {
      const subConfig = catConfig.subcategories.find(s => s.label === item.subcategory);
      if (subConfig && subConfig.studentMarket) {
        isGoverned = true;
      }
    }
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col cursor-pointer group h-full"
    >
      {/* ── IMAGE BOX ── */}
      <div className="relative aspect-square bg-slate-50 rounded-lg overflow-hidden mb-2">
        <img 
          src={item.image_url || `https://picsum.photos/seed/${item.id || item.title}/400/400`} 
          onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${item.id}/400/400`; }}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isSold ? 'blur-[1px] grayscale opacity-50' : ''}`}
          loading="lazy"
          alt={item.title}
        />
        
        {isGoverned && !isSold && (
          <div className="absolute top-2 left-2 w-7 h-7 bg-teal-100 rounded-[8px] flex items-center justify-center z-10 shadow-sm border border-teal-200/50">
            <ShieldCheck size={14} className="text-teal-600" strokeWidth={2.5} />
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 bg-slate-900/25 flex items-center justify-center z-20">
            <p className="text-[10px] font-semibold text-white uppercase tracking-[0.15em] bg-slate-900/50 px-4 py-1.5 rounded-full backdrop-blur-md">
              {item.status === 'SOLD' ? 'Sold' : 'Out of Stock'}
            </p>
          </div>
        )}
      </div>

      {/* ── INFORMATION BLOCK ── */}
      <div className="flex flex-col justify-between flex-1 px-0.5">
        
        {/* Title & Time */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[13px] font-medium text-slate-900 leading-[1.3] tracking-tight line-clamp-2">
            {item.title}
          </h4>
          <span className="text-[11px] font-medium text-[#94a3b8] shrink-0 pt-0.5">
            {timeAgo}
          </span>
        </div>

        {/* Seller Avatar & Name + Price */}
        <div className="flex items-end justify-between mt-2.5 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
               <img 
                 src={item.seller_photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name || 'S'}`} 
                 className="w-full h-full object-cover" 
                 alt={item.seller_name}
               />
            </div>
            <p className="text-[11px] font-medium text-[#64748b] line-clamp-1">
              {item.seller_name || 'Seller'}
            </p>
          </div>
          
          <p className="text-[15px] font-bold text-slate-900 tracking-tight shrink-0 pl-2">
            RM {formattedPrice}
          </p>
        </div>

      </div>
    </motion.div>
  );
}
