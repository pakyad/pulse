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
    <div className="relative w-full py-10">
      {/* Background Track (Institutional Hairline) */}
      <div className="absolute top-[35%] left-0 w-full h-[0.5px] bg-[#F2F2F7] -translate-y-1/2" />
      
      {/* Active Progress Line (Pulse Teal) */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(currentIndex / 2) * 100}%` }}
        className="absolute top-[35%] left-0 h-[1.5px] bg-[#00C4B4] -translate-y-1/2 transition-all duration-1000"
      />

      <div className="relative flex justify-between">
        {STEPS.map((step, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-6">
              {/* Node (Institutional Geometric) */}
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isActive ? '#00C4B4' : '#FFFFFF',
                  borderColor: isActive ? '#00C4B4' : '#F2F2F7',
                  boxShadow: isCurrent ? '0 0 20px rgba(0, 196, 180, 0.2)' : '0 0 0px rgba(0,0,0,0)'
                }}
                className={`w-12 h-12 rounded-[12px] border-[0.5px] flex items-center justify-center transition-all z-10`}
              >
                {isActive ? (
                  <Check size={20} className="text-white" strokeWidth={3} />
                ) : (
                  <step.icon size={20} className="text-black/10" />
                )}
              </motion.div>

              {/* Label (Micro-Utility Typography) */}
              <div className="text-center">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-black' : 'text-black/10'}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <motion.div 
                    layoutId="pulse-dot"
                    className="w-1 h-1 rounded-full bg-[#00C4B4] mx-auto mt-2 animate-pulse"
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
