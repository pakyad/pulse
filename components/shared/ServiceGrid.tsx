"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

//  HIGH-FIDELITY VOXEL / 3D PIXEL ART ENGINE (Pure SVG) 

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

import { Search, Receipt, Calendar, ShieldCheck, MessageSquare, Ticket, ShoppingBag } from 'lucide-react';

const services = [
  { id: 1, label: 'Lost & Found', icon: () => <Search size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />,        path: '/hub/found',                   color: 'bg-[#F59E0B]', shadow: 'bg-[#92400E]' },
  { id: 2, label: 'My Orders',    icon: () => <Receipt size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />,       path: '/me/orders',                   color: 'bg-[#10B981]', shadow: 'bg-[#065F46]' },
  { id: 3, label: 'Events',       icon: () => <Calendar size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />,      path: '/pulse',                       color: 'bg-[#EC4899]', shadow: 'bg-[#9D174D]' },
  { id: 4, label: 'UniStore',     icon: () => <ShieldCheck size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />,   path: '/hub/unistore',                color: 'bg-[#3B82F6]', shadow: 'bg-[#1E40AF]' },
  { id: 5, label: 'Inbox',        icon: () => <MessageSquare size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />, path: '/messages',                    color: 'bg-[#8B5CF6]', shadow: 'bg-[#4C1D95]' },
  { id: 6, label: 'Campaigns',    icon: () => <Ticket size={22} className="text-white drop-shadow-sm" strokeWidth={2.5} />,        path: '/campaigns',                   color: 'bg-[#F43F5E]', shadow: 'bg-[#BE123C]' },
  { id: 7, label: 'Student Market', icon: () => <ShoppingBag size={22} className="text-[#3B6D11] drop-shadow-sm" strokeWidth={2.5} />, path: '/marketplace?pcs=true', color: 'bg-[#EAF3DE]', shadow: 'bg-[#B0CF90]' },
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
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] group-hover:text-slate-900 transition-colors duration-300">
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
