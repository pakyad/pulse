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

// High-Density Pixel Art SVGs (Isometric Composition)
const VoxelStore = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="16" height="12" fill="white" />
    <rect x="6" y="10" width="12" height="8" fill="#f8fafc" />
    <rect x="10" y="4" width="4" height="4" fill="white" />
    <rect x="8" y="6" width="2" height="2" fill="white" />
    <rect x="14" y="6" width="2" height="2" fill="white" />
    <rect x="4" y="8" width="16" height="2" fill="#cbd5e1" opacity="0.5" />
  </svg>
);

const VoxelMed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" fill="white" />
    <rect x="6" y="4" width="12" height="16" fill="white" opacity="0.3" />
    <rect x="10" y="8" width="4" height="8" fill="#EF4444" />
    <rect x="8" y="10" width="8" height="4" fill="#EF4444" />
  </svg>
);

const VoxelEvents = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" fill="white" />
    <rect x="6" y="8" width="12" height="10" fill="#f8fafc" />
    <rect x="8" y="2" width="2" height="4" fill="white" />
    <rect x="14" y="2" width="2" height="4" fill="white" />
    <rect x="8" y="10" width="2" height="2" fill="#EC4899" />
    <rect x="14" y="10" width="2" height="2" fill="#EC4899" />
  </svg>
);

const VoxelSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="12" height="12" fill="white" />
    <rect x="6" y="6" width="8" height="8" fill="#f8fafc" />
    <rect x="14" y="14" width="6" height="6" fill="white" />
    <rect x="12" y="12" width="4" height="4" fill="white" />
  </svg>
);

const VoxelBooks = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="4" height="16" fill="white" />
    <rect x="10" y="4" width="4" height="16" fill="white" />
    <rect x="16" y="4" width="4" height="16" fill="white" />
    <rect x="4" y="6" width="4" height="2" fill="#cbd5e1" />
    <rect x="10" y="8" width="4" height="2" fill="#cbd5e1" />
    <rect x="16" y="10" width="4" height="2" fill="#cbd5e1" />
  </svg>
);

const VoxelLogistics = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="10" width="16" height="8" fill="white" />
    <rect x="14" y="6" width="8" height="12" fill="white" opacity="0.6" />
    <rect x="4" y="18" width="4" height="2" fill="white" />
    <rect x="12" y="18" width="4" height="2" fill="white" />
  </svg>
);

const VoxelMore = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="6" height="6" fill="white" />
    <rect x="14" y="4" width="6" height="6" fill="white" opacity="0.8" />
    <rect x="4" y="14" width="6" height="6" fill="white" opacity="0.6" />
    <rect x="14" y="14" width="6" height="6" fill="white" opacity="0.4" />
  </svg>
);

const services = [
  { id: 1, label: 'UniStore',  icon: VoxelStore,     path: '/hub/unistore', color: 'bg-[#3B82F6]', shadow: 'bg-[#1E40AF]' },
  { id: 2, label: 'Clinic',    icon: VoxelMed,       path: '/hub/med',      color: 'bg-[#EF4444]', shadow: 'bg-[#991B1B]' },
  { id: 3, label: 'Events',    icon: VoxelEvents,    path: '/pulse',        color: 'bg-[#EC4899]', shadow: 'bg-[#9D174D]' },
  { id: 4, label: 'Found',     icon: VoxelSearch,    path: '/hub/found',    color: 'bg-[#F59E0B]', shadow: 'bg-[#92400E]' },
  { id: 5, label: 'Library',   icon: VoxelBooks,     path: '/hub/books',    color: 'bg-[#6366F1]', shadow: 'bg-[#3730A3]' },
  { id: 6, label: 'Logistics', icon: VoxelLogistics, path: '/hub/services', color: 'bg-[#64748B]', shadow: 'bg-[#334155]' },
  { id: 7, label: 'More',      icon: VoxelMore,      path: '/hub/all',      color: 'bg-slate-200', shadow: 'bg-slate-300', isMore: true },
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] group-hover:text-navy transition-colors duration-300">
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
