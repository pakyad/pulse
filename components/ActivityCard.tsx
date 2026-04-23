"use client";

import Link from 'next/link';
import { Zap, Package, Clock } from 'lucide-react';
import React from 'react';

interface ActivityCardProps {
  id: string;
  title: string;
  price: number;
  type: string;
  status: 'PENDING' | 'DROPPED' | 'COLLECTED';
  location?: string;
}

export default function ActivityCard({ id, title, price, type, status, location }: ActivityCardProps) {
  return (
    <Link href={`/orders/${id}`} className="block min-w-[200px]">
      <div className="hologram-card p-4 relative hover:border-orange/50 transition-all duration-300 group">
        {/* Type Badge */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-navy/5 border border-navy/10 flex items-center gap-1">
           <span className="text-[8px] font-bold text-navy/60  ">{type}</span>
           <Zap size={8} className="text-navy/40" />
        </div>
        
        {/* Placeholder Icon Bag */}
        <div className="aspect-video bg-navy/5 rounded-xl mb-4 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
           {status === 'DROPPED' ? (
             <Package className="text-orange w-8 h-8 animate-bounce" />
           ) : (
             <Clock className="text-navy/20 w-8 h-8" />
           )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-navy truncate tracking-tight">{title}</h3>
          <div className="flex justify-between items-baseline">
            <p className="text-[11px] font-black text-orange  ">RM {price.toFixed(2)}</p>
            {location && <p className="text-[9px] text-navy/30 font-mono ">{location}</p>}
          </div>
        </div>
        
        {/* Tech Progress Bar */}
        <div className="mt-4 relative h-1 w-full bg-navy/5 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
              status === 'DROPPED' ? 'w-[70%] bg-orange animate-pulse' : 
              status === 'COLLECTED' ? 'w-full bg-green-500' : 'w-[20%] bg-navy/30'
            }`} 
          />
        </div>
      </div>
    </Link>
  );
}
