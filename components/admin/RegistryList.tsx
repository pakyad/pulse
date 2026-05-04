'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  Check, 
  X, 
  FileText, 
  Stethoscope, 
  AlertCircle, 
  CreditCard, 
  ExternalLink,
  Search,
  Filter,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegistryItem {
  id: string;
  student_id: string;
  student_name: string;
  type: 'MC' | 'APPEAL' | 'FINANCE' | 'REQUEST';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  file_url: string;
  metadata: Record<string, string>;
}

interface RegistryListProps {
  type: 'registry_mc' | 'registry_appeal' | 'registry_finance' | 'registry_letters';
}

const CATEGORY_MAP = {
  registry_mc: { label: 'Medical Registry', icon: Stethoscope, color: 'text-[#00927C]', dbType: 'MC' },
  registry_appeal: { label: 'Appeal Registry', icon: AlertCircle, color: 'text-black', dbType: 'APPEAL' },
  registry_finance: { label: 'Finance Registry', icon: CreditCard, color: 'text-black', dbType: 'FINANCE' },
  registry_letters: { label: 'Official Registry', icon: FileText, color: 'text-black', dbType: 'REQUEST' },
};

export default function RegistryList({ type }: RegistryListProps) {
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const config = CATEGORY_MAP[type];

  useEffect(() => {
    fetchSubmissions();
  }, [type]);

  const fetchSubmissions = async () => {
    setLoading(true);
    // Mocking for FYP Demonstration
    setTimeout(() => {
      const mockData: RegistryItem[] = [
        { 
          id: 'REG-101', 
          student_id: 'ID-9921', 
          student_name: 'Iyad Mohmad', 
          type: config.dbType as any, 
          status: 'PENDING', 
          submitted_at: '2026-04-22 14:30', 
          file_url: '#', 
          metadata: type === 'registry_appeal' ? { 'Course': 'SE102', 'Reason': 'Attendance' } : { 'Dates': '22-24 Apr', 'Clinic': 'Klinik UniKL' }
        },
        { 
          id: 'REG-102', 
          student_id: 'ID-8820', 
          student_name: 'Sarah Rahman', 
          type: config.dbType as any, 
          status: 'PENDING', 
          submitted_at: '2026-04-22 15:45', 
          file_url: '#', 
          metadata: type === 'registry_finance' ? { 'Amount': 'RM 2,500', 'Type': 'Tuition' } : { 'Subject': 'Internship Leave' }
        }
      ];
      setItems(mockData);
      setLoading(false);
    }, 800);
  };

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full bg-slate-50 border-[0.5px] border-[#F2F2F7] rounded-[22px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* List Header (Institutional) */}
      <div className="flex justify-between items-end mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[16px] bg-black/5 flex items-center justify-center text-black/40">
            <config.icon size={24} strokeWidth={2} className={config.color} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 mb-1">Documentation Engine</p>
            <h3 className="text-[20px] font-black text-black uppercase tracking-tighter leading-none">
              {config.label}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button className="h-12 px-6 bg-white text-black/40 rounded-[16px] border-[0.5px] border-[#F2F2F7] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:text-black transition-all">
              <Filter size={14} /> Filter Node
           </button>
           <div className="h-12 px-5 bg-white rounded-[16px] border-[0.5px] border-[#F2F2F7] flex items-center gap-3">
              <Search size={16} className="text-black/10" />
              <input type="text" placeholder="Trace ID..." className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-black/40 w-40 placeholder:text-black/10" />
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px] p-10 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-black/10 transition-all shadow-sm"
            >
              <div className="flex items-start gap-10 flex-1">
                <div className="w-20 h-20 rounded-[16px] bg-slate-50 border-[0.5px] border-[#F2F2F7] flex items-center justify-center overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.student_name}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-6 flex-1">
                   <div>
                      <h4 className="text-black font-black text-[18px] uppercase tracking-tight mb-2 leading-none">{item.student_name}</h4>
                      <div className="flex items-center gap-4 text-black/30">
                         <p className="text-[11px] font-black uppercase tracking-[0.2em]">{item.student_id}</p>
                         <div className="w-1 h-1 rounded-full bg-black/5" />
                         <div className="flex items-center gap-2">
                            <Clock size={12} className="text-black/20" />
                            <p className="text-[11px] font-black uppercase tracking-[0.15em]">{item.submitted_at}</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-3">
                      {Object.entries(item.metadata).map(([key, val]) => (
                        <div key={key} className="px-4 py-2 bg-black/[0.02] rounded-[10px] border-[0.5px] border-[#F2F2F7] flex items-center gap-3">
                           <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">{key}:</span>
                           <span className="text-[11px] font-black text-black uppercase tracking-tight">{val}</span>
                        </div>
                      ))}
                      <button className="h-9 px-4 bg-black text-white rounded-[10px] flex items-center gap-3 hover:bg-black/90 transition-all">
                         <ExternalLink size={12} className="text-white/40" />
                         <span className="text-[9px] font-black uppercase tracking-[0.2em]">View Registry Data</span>
                      </button>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-10 md:mt-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <button 
                  onClick={() => handleAction(item.id, 'APPROVED')}
                  className="h-14 px-10 rounded-[16px] bg-black text-white font-black text-[11px] hover:bg-[#00927C] hover:shadow-2xl hover:shadow-[#00927C]/20 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest"
                >
                  <Check size={18} strokeWidth={3} />
                  Authorize
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'REJECTED')}
                  className="h-14 w-14 rounded-[16px] bg-white border-[0.5px] border-[#F2F2F7] flex items-center justify-center text-black/20 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
