'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Search, MapPin, ChevronRight, Package, CheckCircle2 } from 'lucide-react';
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
    <main className="min-h-screen bg-white font-sans antialiased text-navy max-w-md mx-auto border-x border-slate-50 shadow-sm">
      
      {/* ── HEADER ── */}
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <button onClick={() => router.push('/run')} className="p-2 -ml-2 text-slate-300 hover:text-navy transition-colors">
                 <ArrowLeft size={22} />
              </button>
              <h1 className="text-[26px] font-bold tracking-tight">Job History</h1>
           </div>
        </div>

        {/* Search Pill */}
        <div className="relative group">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-navy transition-colors" />
           <input 
              type="text" 
              placeholder="Search by location or item..."
              className="w-full h-11 bg-slate-50 border border-slate-100/50 rounded-2xl pl-12 pr-4 text-[13px] font-medium placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-navy/5 transition-all"
           />
        </div>
      </header>

      {/* ── HISTORY LIST ── */}
      <section className="px-6 py-6 space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 ml-1">Recent Syncs</p>
        
        {displayHistory.map((job) => (
          <motion.div 
            key={job.id}
            whileTap={{ scale: 0.98 }}
            className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                     <CheckCircle2 size={18} />
                  </div>
                  <div>
                     <h4 className="text-[14px] font-bold text-navy leading-none">{job.item}</h4>
                     <p className="text-[11px] text-slate-400 font-medium mt-1">{job.date}</p>
                  </div>
               </div>
               <p className="text-[16px] font-black text-navy">+RM {job.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 bg-slate-50 p-3 rounded-xl">
               <span className="flex items-center gap-1.5 text-navy/70"><MapPin size={12}/> {job.from}</span>
               <ChevronRight size={12} className="text-slate-300"/>
               <span>{job.to}</span>
            </div>
          </motion.div>
        ))}

        <div className="text-center pt-8 opacity-20">
           <History size={24} className="mx-auto mb-2" />
           <p className="text-[9px] font-bold uppercase tracking-[0.4em]">End of Transcript</p>
        </div>
      </section>

    </main>
  );
}
