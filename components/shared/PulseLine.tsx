"use client";
import { motion } from "framer-motion";
import { Check, Package, Truck, Home, MapPin } from "lucide-react";

interface PulseLineProps {
  state: 'ordered' | 'preparing' | 'delivered';
}

const STEPS = [
  { id: 'ordered', label: 'Order Registry', icon: Package },
  { id: 'preparing', label: 'Asset Prep', icon: Truck },
  { id: 'delivered', label: 'Handover', icon: Home },
];

export default function PulseLine({ state }: PulseLineProps) {
  const getIndex = () => {
    if (state === 'delivered') return 2;
    if (state === 'preparing') return 1;
    return 0;
  };

  const currentIndex = getIndex();

  return (
    <div className="relative w-full py-8">
      {/* Background Track */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2" />
      
      {/* Active Progress Line */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(currentIndex / 2) * 100}%` }}
        className="absolute top-1/2 left-0 h-[1px] bg-[#00C4B4] -translate-y-1/2 transition-all duration-1000"
      />

      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-4">
              {/* Node */}
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isActive ? '#00C4B4' : '#F8F9FA',
                  borderColor: isActive ? '#00C4B4' : '#F2F2F7'
                }}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shadow-sm z-10`}
              >
                {isActive ? (
                  <Check size={18} className="text-white" strokeWidth={3} />
                ) : (
                  <step.icon size={18} className="text-slate-300" />
                )}
              </motion.div>

              {/* Label */}
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-navy' : 'text-slate-300'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.div 
                    layoutId="pulse-dot"
                    className="w-1 h-1 rounded-full bg-[#00C4B4] mx-auto mt-1 animate-pulse"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
