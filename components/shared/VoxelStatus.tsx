"use client";

import React from 'react';
import { motion } from 'framer-motion';

/**
 *  Institutional Voxel Status Core
 * Pure SVG block-geometry icons for high-fidelity status tracking.
 */

export const VoxelPulse = ({ className = "text-emerald-500", size = 20 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <motion.rect 
      animate={{ opacity: [0.4, 1, 0.4] }} 
      transition={{ duration: 1.5, repeat: Infinity }}
      x="2" y="10" width="4" height="4" fill="currentColor" rx="0.5" 
    />
    <motion.rect 
      animate={{ opacity: [0.4, 1, 0.4] }} 
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      x="7" y="6" width="4" height="12" fill="currentColor" rx="0.5" 
    />
    <motion.rect 
      animate={{ opacity: [0.4, 1, 0.4] }} 
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      x="12" y="10" width="4" height="4" fill="currentColor" rx="0.5" 
    />
    <motion.rect 
      animate={{ opacity: [0.4, 1, 0.4] }} 
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
      x="17" y="8" width="4" height="8" fill="currentColor" rx="0.5" 
    />
  </svg>
);

export const VoxelRadar = ({ className = "text-slate-900", size = 20 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Central Core Voxel */}
    <rect x="10" y="10" width="4" height="4" fill="currentColor" rx="1" />
    
    {/* Expanding Inner Voxel Field */}
    <motion.rect 
      x="10" y="10" width="4" height="4" rx="1"
      animate={{ 
        x: [10, 2], y: [10, 2], width: [4, 20], height: [4, 20],
        opacity: [0.8, 0], strokeWidth: [1.5, 0.5] 
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      stroke="currentColor" fill="none"
    />
    
    {/* Expanding Outer Voxel Field */}
    <motion.rect 
      x="10" y="10" width="4" height="4" rx="1"
      animate={{ 
        x: [10, 2], y: [10, 2], width: [4, 20], height: [4, 20],
        opacity: [0.8, 0], strokeWidth: [1.5, 0.5] 
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
      stroke="currentColor" fill="none"
    />

    {/* Four Corner Institutional Anchors */}
    <motion.rect animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity }} x="3" y="3" width="2" height="2" fill="currentColor" rx="0.5" />
    <motion.rect animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} x="19" y="3" width="2" height="2" fill="currentColor" rx="0.5" />
    <motion.rect animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.0 }} x="19" y="19" width="2" height="2" fill="currentColor" rx="0.5" />
    <motion.rect animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.5 }} x="3" y="19" width="2" height="2" fill="currentColor" rx="0.5" />
  </svg>
);

export const VoxelBox = ({ className = "text-amber-500", size = 20 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="10" width="16" height="8" fill="currentColor" rx="0.5" />
    <rect x="6" y="6" width="12" height="4" fill="currentColor" opacity="0.6" rx="0.5" />
    <rect x="11" y="8" width="2" height="10" fill="white" opacity="0.3" />
  </svg>
);

export const VoxelCheck = ({ className = "text-emerald-500", size = 20 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="12" width="4" height="4" fill="currentColor" rx="0.5" />
    <rect x="8" y="16" width="4" height="4" fill="currentColor" rx="0.5" />
    <rect x="12" y="12" width="4" height="4" fill="currentColor" rx="0.5" />
    <rect x="16" y="8" width="4" height="4" fill="currentColor" rx="0.5" />
    <rect x="20" y="4" width="4" height="4" fill="currentColor" rx="0.5" />
  </svg>
);

export default function VoxelStatus({ status, size = 16 }: { status: string, size?: number }) {
  switch (status.toUpperCase()) {
    case 'PENDING':
    case 'PENDING_VENDOR':
      return <VoxelRadar className="text-slate-900" size={size} />;
    case 'PREPARING':
    case 'AWAITING_RUNNER':
      return <VoxelBox className="text-amber-500" size={size} />;
    case 'IN_TRANSIT':
    case 'ON_THE_WAY':
    case 'ARRIVED':
      return <VoxelPulse className="text-slate-900" size={size} />;
    case 'DELIVERED':
    case 'COMPLETED':
      return <VoxelCheck className="text-emerald-500" size={size} />;
    default:
      return <div className="w-2 h-2 bg-slate-200 rounded-sm" />;
  }
}
