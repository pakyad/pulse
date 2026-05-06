"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Waves } from 'lucide-react';

interface Slot {
  id: string;
  type: 'WORKSTATION' | 'LOUNGE' | 'STUDIO';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  specs?: string[];
  x: number;
  y: number;
}

interface FacilityCanvasProps {
  slots: Slot[];
  selectedSlotId: string | null;
  onSelectSlot: (id: string) => void;
  noiseLevel: number;
  temperature: number;
}

export default function FacilityCanvas({ slots, selectedSlotId, onSelectSlot }: FacilityCanvasProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot) => {
          const isActive = selectedSlotId === slot.id;
          const isAvailable = slot.status === 'AVAILABLE';
          
          return (
            <motion.button
              key={slot.id}
              onClick={() => isAvailable && onSelectSlot(slot.id)}
              whileTap={{ scale: 0.98 }}
              className={`relative h-20 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                  : isAvailable 
                    ? 'bg-white border-slate-100 text-slate-600 hover:border-slate-300' 
                    : 'bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                Pod {slot.id}
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-wider mt-1 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                {slot.type.charAt(0) + slot.type.slice(1).toLowerCase()}
              </span>
              
              {/* Minimal Status Indicator */}
              <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                slot.status === 'AVAILABLE' ? 'bg-emerald-500' : 
                slot.status === 'OCCUPIED' ? 'bg-slate-300' : 'bg-slate-200'
              }`} />
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-6 px-1">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-400">Available</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs font-medium text-slate-400">Occupied</span>
         </div>
      </div>
    </div>
  );
}
