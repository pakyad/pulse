"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, User, ShieldCheck, MapPin } from 'lucide-react';

interface IDCardProps {
  name: string;
  role: string;
  matricNo: string;
  qrValue: string;
  claimToken?: string;
  roleColor?: string;
}

export default function HologramID({ name, role, matricNo, qrValue, claimToken, roleColor }: IDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-[320px] h-[480px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className="relative w-full h-full transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front: Hologram ID */}
        <div className="absolute inset-0 backface-hidden hologram-card rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center">
                <ShieldCheck className="text-navy w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px]  tracking-widest opacity-50">University Ecosystem</p>
                <p className="font-bold text-navy">Pulse ID</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-navy/5 to-pearl border-[0.5px] border-navy/10 flex items-center justify-center">
                <User className="text-navy opacity-20 w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy leading-tight">{name}</h2>
                <p className={`${roleColor || 'text-orange'} font-medium flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleColor?.replace('text-', 'bg-') || 'bg-orange'} animate-pulse`} />
                  {role}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-navy/10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px]  tracking-widest opacity-50 mb-1">Matric Number</p>
                <p className="font-mono text-navy ">{matricNo}</p>
              </div>
              <MapPin className="text-navy opacity-20 w-5 h-5" />
            </div>
          </div>

          {/* Holographic SVE Refraction */}
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Back: Dynamic QR */}
        <div className="absolute inset-0 backface-hidden hologram-card rounded-3xl p-8 flex flex-col items-center justify-center rotate-y-180">
          <p className="text-[10px] text-navy/40 mb-4  tracking-[0.2em] font-black">Transaction Verified</p>
          <div className="bg-white p-4 rounded-2xl shadow-inner mb-6 border-[0.5px] border-navy/10">
            {claimToken ? (
              <QrCode className="w-32 h-32 text-navy" />
            ) : (
              <div className="w-32 h-32 bg-navy/5 rounded-xl border-dashed border-[0.5px] border-navy/20 flex items-center justify-center">
                 <QrCode className="w-12 h-12 text-navy/10" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-navy mb-1  tracking-widest text-xs">Handshake Handshake</p>
            <p className="text-[10px] text-navy opacity-40 px-4 leading-tight">Show this to the seller/runner to complete the secure handshake.</p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-navy/10 w-full text-center">
             <p className="font-mono text-sm font-black text-navy tracking-widest">
                {claimToken ? `# ${claimToken}` : 'ID_ONLY_MODE'}
             </p>
          </div>
        </div>
      </motion.div>

      {/* Tailwind handles standard 3D transforms, but backface-hidden/perspective often needs custom classes in globals.css */}
      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
