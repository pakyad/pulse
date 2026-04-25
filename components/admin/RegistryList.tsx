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
  registry_mc: { label: 'Medical Certs', icon: Stethoscope, color: 'text-emerald-500', dbType: 'MC' },
  registry_appeal: { label: 'Exam Appeals', icon: AlertCircle, color: 'text-amber-500', dbType: 'APPEAL' },
  registry_finance: { label: 'Finance Proofs', icon: CreditCard, color: 'text-blue-500', dbType: 'FINANCE' },
  registry_letters: { label: 'Official Letters', icon: FileText, color: 'text-violet-500', dbType: 'REQUEST' },
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
    // Mocking the fetch since we haven't integrated the real submission yet
    // In production, this would query the 'submissions' collection
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
    // In real app: updateDoc(doc(db, "submissions", id), { status: action });
    setItems(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* List Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${config.color}`}>
            <config.icon size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[#0A0F1E] font-bold text-xl leading-none mb-1">
              {config.label} Queue
            </h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              {items.length} Awaiting Registry Stamp
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="h-10 px-4 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest hover:bg-white hover:text-navy transition-all">
              <Filter size={14} /> Filter
           </button>
           <div className="h-10 px-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <Search size={14} className="text-slate-300" />
              <input type="text" placeholder="Search ID..." className="bg-transparent border-none outline-none text-[12px] font-medium text-slate-500 w-32" />
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-[3rem] p-10 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-navy transition-all shadow-sm"
            >
              <div className="flex items-start gap-8 flex-1">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.student_name}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-4 flex-1">
                   <div>
                      <h4 className="text-[#0A0F1E] font-bold text-[18px] tracking-widest mb-1">{item.student_name}</h4>
                      <div className="flex items-center gap-3 text-slate-300">
                         <p className="text-[11px] font-black uppercase tracking-widest">{item.student_id}</p>
                         <span className="w-1 h-1 rounded-full bg-slate-200" />
                         <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <p className="text-[11px] font-bold uppercase tracking-widest">{item.submitted_at}</p>
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-3">
                      {Object.entries(item.metadata).map(([key, val]) => (
                        <div key={key} className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{key}:</span>
                           <span className="text-[11px] font-bold text-navy">{val}</span>
                        </div>
                      ))}
                      <button className="px-3 py-1.5 bg-navy text-white rounded-xl flex items-center gap-2 hover:bg-navy/80 transition-all">
                         <ExternalLink size={12} />
                         <span className="text-[9px] font-black uppercase tracking-widest">View Document</span>
                      </button>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleAction(item.id, 'APPROVED')}
                  className="h-12 px-8 rounded-3xl bg-navy text-white font-bold text-[12px] hover:scale-105 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-navy/10"
                >
                  <Check size={18} />
                  Approve
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'REJECTED')}
                  className="h-12 w-12 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
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
