'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight, Globe } from 'lucide-react';

interface FacilityModuleProps {
  name: string;
  area: string;
  status: string;
  icon: LucideIcon;
}

export default function FacilityModule({ 
  name, 
  area, 
  status, 
  icon: Icon
}: FacilityModuleProps) {
  
  const isOnline = status === 'OPEN' || status === 'ONLINE' || status?.includes?.('%');

  return (
    <motion.div 
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      className="p-6 flex items-center justify-between group cursor-pointer transition-all rounded-2xl border border-transparent hover:border-white/10"
    >
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-inner">
          {Icon ? <Icon size={22} strokeWidth={1.5} /> : <Globe size={22} strokeWidth={1.5} />}
        </div>

        <div className="space-y-1">
           <h4 className="text-[15px] font-bold text-white tracking-widest uppercase group-hover:text-accent transition-colors">{name}</h4>
           <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{area}</p>
              {isOnline && <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
         <div className="text-right">
            <p className={`font-mono-data text-[13px] font-black tracking-tighter uppercase ${isOnline ? 'text-accent' : 'text-red-400'}`}>{status}</p>
            <p className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-1">Telemetry Active</p>
         </div>

         <div className="w-8 h-8 rounded-xl border border-white/5 flex items-center justify-center text-white/10 group-hover:text-accent group-hover:border-accent group-hover:bg-accent/5 transition-all">
            <ChevronRight size={14} strokeWidth={3} />
         </div>
      </div>
    </motion.div>
  );
}
