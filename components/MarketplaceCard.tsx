"use client";

import { ShoppingBag, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MarketplaceCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    seller_id: string;
    stock_count?: number;
    is_official?: boolean;
  };
  onPurchase?: (id: string) => void;
}

export default function MarketplaceCard({ item, onPurchase }: MarketplaceCardProps) {
  return (
    <Link href={`/marketplace/${item.id}`}>
        <motion.div 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="hologram-card p-2.5 group cursor-pointer transition-all bg-white/40 border-navy/5 h-full"
        >
      <div className="relative aspect-4/5 rounded-2xl overflow-hidden mb-3 bg-navy/5 shadow-inner">
        <img 
          src={item.image_url} 
          alt={item.title} 
          className="object-cover w-full h-full grayscale-30 group-hover:grayscale-0 transition-all duration-700 ease-out scale-105 group-hover:scale-100" 
        />
        
        {/* Pricing Badge */}
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-navy/5 shadow-md">
          <p className="text-[11px] font-semibold text-navy tabular-nums">RM {item.price.toFixed(2)}</p>
        </div>

        {/* Official Stakeholder Tag */}
        {item.is_official && (
            <div className="absolute top-3 left-3 bg-orange/90 backdrop-blur-md p-1.5 rounded-full shadow-md">
                <ShieldCheck className="text-white w-3 h-3" />
            </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onPurchase?.(item.id);
                }}
                className="w-full bg-white text-navy py-2 rounded-xl text-[10px] font-semibold  tracking-widest shadow-md flex items-center justify-center gap-2"
            >
                <ShoppingBag size={12} />
                Acquire Pulse
            </button>
        </div>
      </div>
      
      <div className="px-1.5 pb-1">
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-[12px] font-semibold text-navy  leading-tight tracking-widest w-[70%] truncate">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 opacity-20">
                <Zap size={10} className="fill-navy" />
                <span className="text-[8px] font-semibold ">Active</span>
            </div>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex flex-col">
            <p className="text-[9px] text-navy/30 font-semibold  tracking-widest leading-none mb-0.5">Inventory</p>
            <p className="text-[10px] text-navy/60 font-semibold tabular-nums">
                {item.stock_count || 1} UNITS
            </p>
          </div>
          
          <button className="text-orange group-hover:scale-125 transition-transform p-2 bg-orange/5 rounded-full">
            <ShoppingBag size={14} className="fill-orange/20" />
          </button>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
