'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { History, Search, MapPin, ChevronRight, Package, CheckCircle2 } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

export default function RunnerHistoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        // 1. Listen to Profile
        onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.data()));

        // 2. Listen to Transactions Sub-collection
        const q = query(
          collection(db, 'users', user.uid, 'transactions'), 
          orderBy('timestamp', 'desc')
        );
        
        const unsubTx = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHistory(docs);
          setLoading(false);
        });

        return () => { unsubTx(); };
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, [router]);

  const displayHistory = history.length > 0 ? history : [
    { id: 'd1', item: 'Nasi Lemak Ayam', from: 'Cafe Block A', to: 'Library East', price: 4.50, date: 'Today, 14:20', timestamp: new Date() },
    { id: 'd2', item: 'Iced Milo', from: 'Mamak Block B', to: 'V1 Hostel', price: 3.00, date: 'Today, 11:15', timestamp: new Date() },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 max-w-2xl mx-auto border-x border-slate-100 shadow-sm pb-40">
      
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <BackButton fallback="/run" />
         <p className="text-[14px] font-bold tracking-tight">Mission History</p>
      </nav>

      {/* ── SEARCH BAR ── */}
      <section className="px-8 pt-28 pb-4">
        <div className="relative group">
           <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
           <input 
              type="text" 
              placeholder="Search by location or item..."
              className="w-full h-12 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 text-[14px] font-medium placeholder:text-[#94a3b8] outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-sm"
           />
        </div>
      </section>

      {/* ── HISTORY LIST ── */}
      <section className="px-8 mt-2 space-y-3">
        <p className="text-[11px] font-bold text-slate-400  mb-4 ml-1">Completed Missions</p>
        
        {displayHistory.map((job) => (
          <motion.div 
            key={job.id}
            whileTap={{ scale: 0.98 }}
            className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                     <CheckCircle2 size={24} />
                  </div>
                  <div>
                     <h4 className="text-[15px] font-bold tracking-tight leading-tight">{job.item}</h4>
                     <p className="text-[12px] text-slate-400 font-medium mt-0.5">{job.date}</p>
                  </div>
               </div>
               <p className="text-[16px] font-semibold text-slate-900 tracking-tight">+RM {job.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-3 text-[12px] font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
               <span className="flex items-center gap-2 text-slate-700 truncate"><MapPin size={14} className="text-slate-400"/> {job.from}</span>
               <ChevronRight size={14} className="text-slate-300 shrink-0"/>
               <span className="truncate">{job.to}</span>
            </div>
          </motion.div>
        ))}

        <div className="text-center pt-16 opacity-30 flex flex-col items-center">
           <History size={24} strokeWidth={1.5} className="mb-3 text-slate-400" />
           <p className="text-[10px] font-semibold text-slate-400 ">End of Log</p>
        </div>
      </section>

    </main>
  );
}
