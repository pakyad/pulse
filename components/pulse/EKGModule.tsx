'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity, AlertTriangle, Waves } from 'lucide-react';

interface EKGModuleProps {
  title: string;
  status: string;
  val: string;
  type: 'CLOCK' | 'WAVE' | 'ALERT';
}

const Waveform = ({ color = "stroke-accent" }) => (
  <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none opacity-20">
    <svg width="200%" height="100%" viewBox="0 0 200 60" preserveAspectRatio="none">
      <motion.path
        d="M0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className={color}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  </div>
);

export default function EKGModule({ 
  title, 
  status, 
  val, 
  type
}: EKGModuleProps) {
  
  const statusColors: Record<string, string> = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-100',
    ONLINE: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    STABLE: 'text-accent bg-accent/5 border-accent/10',
    SECURE: 'text-blue-600 bg-blue-50 border-blue-100',
    WARNING: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  const Icon = type === 'CLOCK' ? Clock : type === 'WAVE' ? Activity : AlertTriangle;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="bg-white border border-slate-100 p-8 rounded-[2.5rem] transition-all cursor-pointer space-y-8 group shadow-sm hover:shadow-2xl hover:shadow-navy/5 relative overflow-hidden"
    >
      {type === 'WAVE' && <Waveform color={status === 'CRITICAL' ? 'stroke-red-500' : 'stroke-emerald-500'} />}
      
      <div className="flex justify-between items-start relative z-10">
         <div className={`px-3 py-1 rounded-full border ${statusColors[status] || 'text-slate-400 bg-slate-50 border-slate-100'} flex items-center gap-2`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.1em] uppercase">
              {status}
            </span>
         </div>
         <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-navy group-hover:text-white transition-all">
            <Icon size={18} className="text-slate-400 group-hover:text-white transition-colors" />
         </div>
      </div>

      <div className="space-y-2 relative z-10">
        <p className="text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase">
          {title}
        </p>
        <p className="text-4xl font-black tracking-tighter italic text-navy">
          {val}
        </p>
      </div>

      <div className="flex items-center gap-2 relative z-10">
         {[1,2,3,4,5,6,7,8].map(i => (
           <motion.div 
             key={i} 
             initial={{ opacity: 0.3 }}
             animate={{ opacity: [0.3, 1, 0.3] }}
             transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
             className={`h-1 flex-1 rounded-full ${i < 6 ? (status === 'CRITICAL' ? 'bg-red-500' : 'bg-accent') : 'bg-slate-100'}`} 
           />
         ))}
      </div>
    </motion.div>
  );
}
