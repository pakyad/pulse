"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ── HIGH-FIDELITY VOXEL / 3D PIXEL ART ENGINE (Pure SVG) ──

const VoxelContainer = ({ children, color, shadow }: { children: React.ReactNode, color: string, shadow: string }) => (
  <div className={`w-[48px] h-[48px] relative group cursor-pointer`}>
    {/* 3D Base (Shadow/Extrusion) */}
    <div className={`absolute inset-0 translate-y-1.5 translate-x-1 rounded-xl ${shadow} transition-all duration-300 group-hover:translate-y-2.5 group-hover:translate-x-1.5`} />
    {/* Main Voxel Block */}
    <div className={`absolute inset-0 rounded-xl ${color} border-2 border-black/10 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:-translate-x-0.5 group-active:translate-y-0.5 group-active:translate-x-0.5 shadow-inner`}>
      <div className="relative z-10 scale-[1.2] drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] group-hover:scale-[1.3] transition-transform duration-300">
        {children}
      </div>
    </div>
  </div>
);

// ── VOXEL ICONS — All 6 unique destinations ──

// Market / Shopping bag
const VoxelMarket = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="11" fill="white" rx="1"/>
    <rect x="6" y="12" width="12" height="7" fill="white" opacity="0.4"/>
    <path d="M8 10 Q8 6 12 6 Q16 6 16 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="10" y="13" width="4" height="3" fill="white" opacity="0.8" rx="0.5"/>
  </svg>
);

// Deliveries / Runner carrying parcel
const VoxelDeliveries = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="10" cy="5" r="2" fill="white"/>
    <rect x="8" y="7" width="4" height="6" fill="white" rx="1"/>
    <rect x="6" y="13" width="3" height="5" fill="white" opacity="0.7" rx="0.5"/>
    <rect x="11" y="13" width="3" height="5" fill="white" opacity="0.7" rx="0.5"/>
    <rect x="13" y="8" width="5" height="4" fill="white" opacity="0.9" rx="0.5"/>
    <rect x="14" y="9" width="3" height="2" fill="white" opacity="0.4"/>
  </svg>
);

// Events / Calendar
const VoxelEvents = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="16" height="16" fill="white" />
    <rect x="6" y="8" width="12" height="10" fill="#f8fafc" />
    <rect x="8" y="2" width="2" height="4" fill="white" />
    <rect x="14" y="2" width="2" height="4" fill="white" />
    <rect x="8" y="10" width="2" height="2" fill="#EC4899" />
    <rect x="14" y="10" width="2" height="2" fill="#EC4899" />
  </svg>
);

// My Orders / Receipt
const VoxelOrders = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" fill="white" rx="1"/>
    <rect x="7" y="6" width="10" height="1.5" fill="white" opacity="0.5" rx="0.5"/>
    <rect x="7" y="9" width="8" height="1.5" fill="white" opacity="0.5" rx="0.5"/>
    <rect x="7" y="12" width="10" height="1.5" fill="white" opacity="0.5" rx="0.5"/>
    <rect x="7" y="15" width="6" height="1.5" fill="white" opacity="0.8" rx="0.5"/>
    <path d="M5 21 L8 19 L11 21 L14 19 L17 21 L19 19 L19 21" fill="white"/>
  </svg>
);

// My Shop / Storefront — routes to /me (seller hub with listings)
const VoxelShop = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="10" fill="white" rx="1"/>
    <rect x="5" y="13" width="5" height="6" fill="white" opacity="0.4" rx="0.5"/>
    <rect x="14" y="13" width="5" height="6" fill="white" opacity="0.4" rx="0.5"/>
    <path d="M3 11 L5 4 H19 L21 11" fill="white" opacity="0.7"/>
    <rect x="8" y="4" width="3" height="7" fill="white" opacity="0.3"/>
    <rect x="13" y="4" width="3" height="7" fill="white" opacity="0.3"/>
  </svg>
);

// Wallet / Earnings — routes to /run/wallet
const VoxelWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" fill="white" rx="2"/>
    <rect x="2" y="7" width="20" height="4" fill="white" opacity="0.5"/>
    <rect x="15" y="12" width="5" height="4" fill="white" opacity="0.8" rx="1"/>
    <circle cx="17.5" cy="14" r="1" fill="white" opacity="0.4"/>
    <rect x="4" y="3" width="16" height="4" fill="white" opacity="0.3" rx="1"/>
  </svg>
);

const services = [
  { id: 1, label: 'Market',    icon: VoxelMarket,     path: '/marketplace', color: 'bg-[#3B82F6]', shadow: 'bg-[#1E40AF]' },
  { id: 2, label: 'Deliveries',icon: VoxelDeliveries, path: '/run',         color: 'bg-[#F59E0B]', shadow: 'bg-[#92400E]' },
  { id: 3, label: 'Events',    icon: VoxelEvents,     path: '/pulse',       color: 'bg-[#EC4899]', shadow: 'bg-[#9D174D]' },
  { id: 4, label: 'My Orders', icon: VoxelOrders,     path: '/me/orders',   color: 'bg-[#10B981]', shadow: 'bg-[#065F46]' },
  { id: 5, label: 'My Shop',   icon: VoxelShop,       path: '/me',          color: 'bg-[#8B5CF6]', shadow: 'bg-[#4C1D95]' },
  { id: 6, label: 'Wallet',    icon: VoxelWallet,     path: '/run/wallet',  color: 'bg-[#64748B]', shadow: 'bg-[#334155]' },
];

const ServiceGrid = () => {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[240px]" />;

  return (
    <section className="px-1 py-2">
      <div className="grid grid-cols-4 gap-x-2 gap-y-10">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: index * 0.04
            }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-4 cursor-pointer group"
            onClick={() => router.push(service.path)}
          >
            <VoxelContainer color={service.color} shadow={service.shadow}>
              <service.icon />
            </VoxelContainer>
            
            <div className="text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] group-hover:text-slate-900 transition-colors duration-300">
                {service.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServiceGrid;
