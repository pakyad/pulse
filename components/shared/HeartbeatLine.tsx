'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeartbeatLineProps {
  className?: string;
  color?: string;
  speed?: number;
}

export default function HeartbeatLine({ 
  className = "", 
  color = "currentColor", 
  speed = 4 
}: HeartbeatLineProps) {
  // A clean, medical-grade heartbeat path
  const path = "M0 20 L20 20 L25 10 L30 30 L35 0 L40 40 L45 20 L100 20";

  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ height: '40px' }}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="w-full h-full opacity-20"
      >
        <motion.path
          d={path}
          fill="transparent"
          stroke={color}
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1],
            opacity: [0, 1, 0],
            x: [0, 0, 100] // Sliding effect
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    </div>
  );
}
