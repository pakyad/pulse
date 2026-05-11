'use client'
import React from 'react';
import { DomainID } from '@/lib/marketplace/domains';

interface DomainSelectorProps {
  selectedDomain: DomainID | '';
  onSelect: (domain: DomainID) => void;
}

const DOMAIN_LABELS: Record<DomainID, string> = {
  HUNGER: 'Food',
  ACADEMIC: 'Books',
  SERVICES: 'Services',
  HOSTEL: 'Hostel',
  TECH: 'Tech'
};

const DomainSelector: React.FC<DomainSelectorProps> = ({ selectedDomain, onSelect }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
        Classification Index
      </h2>
      
      <div className="flex gap-10 overflow-x-auto no-scrollbar pb-4 border-b border-slate-50">
        {(Object.keys(DOMAIN_LABELS) as DomainID[]).map((id, index) => {
          const isActive = selectedDomain === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group relative shrink-0 flex flex-col items-start gap-1 transition-all"
            >
              <span className={`text-[9px] font-black tracking-widest leading-none ${isActive ? 'text-slate-900' : 'text-slate-200'}`}>
                0{index + 1}
              </span>
              <span className={`text-[14px] font-bold tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                {DOMAIN_LABELS[id]}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-slate-900 animate-in slide-in-from-left-2 duration-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DomainSelector;
