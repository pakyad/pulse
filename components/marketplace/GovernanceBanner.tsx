'use client'
import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface GovernanceBannerProps {
  status: 'STABLE' | 'WARNING' | 'BLOCKED';
  message: string | null;
}

const GovernanceBanner: React.FC<GovernanceBannerProps> = ({ status, message }) => {
  if (status === 'STABLE') return null;

  const isBlocked = status === 'BLOCKED';

  return (
    <div className={`py-10 border-t border-slate-50 animate-in fade-in duration-500`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isBlocked ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
          {isBlocked ? <ShieldX size={20} /> : <ShieldAlert size={20} />}
        </div>
        <div className="space-y-0.5">
          <h2 className={`text-[14px] font-bold tracking-tight ${isBlocked ? 'text-red-600' : 'text-amber-600'}`}>
            {isBlocked ? 'Institutional Block' : 'Governance Advisory'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Administrative Registry
          </p>
        </div>
      </div>
      
      <div className={`p-6 rounded-[32px] border ${isBlocked ? 'bg-red-50/30 border-red-50 text-red-700' : 'bg-amber-50/30 border-amber-50 text-amber-700'}`}>
        <p className="text-[12px] font-bold leading-relaxed tracking-tight">
          {message}
        </p>
      </div>

      {isBlocked && (
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Listing requires administrative appeal
        </p>
      )}
    </div>
  );
};

export default GovernanceBanner;
