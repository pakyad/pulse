"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { 
  ShieldCheck, 
  TrendingUp, 
  Search, 
  Zap, 
  LayoutDashboard, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPrestigePage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Gated Access: Ensure ONLY Admins can see this
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.data()?.role !== 'ADMIN') {
          router.push('/home'); // Lockout non-admins
        }
      } else {
        router.push('/auth');
      }
    });

    // 2. Fetch Pending Campaigns
    const q = query(collection(db, "campaigns"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, async (sn) => {
       const list = [];
       for (const d of sn.docs) {
          const camp = { id: d.id, ...d.data() } as any;
          const itemSnap = await getDoc(doc(db, "items", camp.item_id));
          list.push({ ...camp, item: itemSnap.data() });
       }
       setCampaigns(list);
       setLoading(false);
    });

    return () => { unsubAuth(); unsub(); };
  }, []);

  const handleAuthorize = async (id: string) => {
    await updateDoc(doc(db, "campaigns", id), {
      status: 'active',
      approved_at: Date.now(),
      approved_by: auth.currentUser?.uid
    });
    setSelectedCamp(null);
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, "campaigns", id), {
      status: 'rejected'
    });
    setSelectedCamp(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A1121] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-white/10 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#060B16] text-white p-8 md:p-16 font-sans antialiased">
      
      {/* ADMIN HEADER */}
      <div className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                 <ShieldCheck size={18} />
               </div>
               <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/40">Pulse Admin Core</p>
            </div>
            <h1 className="text-[36px] font-bold tracking-tight">Prestige Authorization</h1>
         </div>
         
         <div className="flex items-center gap-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-center">
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Pending Syncs</p>
               <p className="text-[20px] font-bold">{campaigns.length}</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <button onClick={() => router.push('/merchant')} className="text-[12px] font-bold text-accent hover:text-white transition-colors">Terminals View →</button>
         </div>
      </div>

      {/* PENDING LEDGER */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         <div className="lg:col-span-12 space-y-4">
            <h3 className="text-[14px] font-bold text-white/20 uppercase tracking-[0.2em] mb-8">Authorization Queue</h3>
            
            {campaigns.length === 0 ? (
               <div className="py-32 text-center bg-white/5 rounded-[4rem] border border-white/5">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10 mb-6">
                     <CheckCircle2 size={40} />
                  </div>
                  <p className="text-[13px] font-bold text-white/20 uppercase tracking-[0.2em]">Queue Pulse Clean</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((camp) => (
                    <motion.div 
                      key={camp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/5 p-8 rounded-[3rem] hover:bg-white/8 transition-all group relative overflow-hidden"
                    >
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          {camp.template_id === 'overture' ? <LayoutDashboard size={80} /> : camp.template_id === 'spotlight' ? <Search size={80} /> : <Zap size={80} />}
                       </div>

                       <div className="relative z-10 space-y-6">
                          <div className="flex justify-between items-start">
                             <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border
                               ${camp.template_id === 'overture' ? 'bg-slate-900/10 text-blue-400 border-blue-400/20' : camp.template_id === 'spotlight' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-orange-500/10 text-orange-400 border-orange-400/20'}`}
                             >
                                {camp.template_id}
                             </div>
                             <div className="flex items-center gap-2 text-white/20">
                                <Clock size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">{camp.schedule_slot || 'ASAP'}</span>
                             </div>
                          </div>

                          <div className="space-y-1">
                             <h4 className="text-[18px] font-bold tracking-widest text-white line-clamp-1">{camp.creative?.headline || camp.item?.title}</h4>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{camp.campus || 'Global'}</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{camp.item?.seller_name || 'MIIT Official'}</p>
                             </div>
                          </div>

                          <div className="pt-6 border-t border-white/5 flex gap-3">
                             <button 
                               onClick={() => setSelectedCamp(camp)}
                               className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center justify-center gap-2 text-[11px] font-bold transition-all"
                             >
                                <Eye size={14} /> Preview
                             </button>
                             <button 
                               onClick={() => handleAuthorize(camp.id)}
                               className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-green-500/20"
                             >
                                <CheckCircle2 size={18} />
                             </button>
                             <button 
                               onClick={() => handleReject(camp.id)}
                               className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                             >
                                <XCircle size={18} />
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* ADMIN PREVIEW OVERLAY */}
      <AnimatePresence>
        {selectedCamp && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedCamp(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-[#0A1121] w-full max-w-md rounded-[4rem] p-12 relative z-10 shadow-md border border-white/10 overflow-hidden"
            >
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,transparent_70%)] opacity-30" />
               
               <div className="relative z-10 space-y-12">
                  <div className="flex justify-between items-center">
                     <div className="space-y-1">
                        <h3 className="text-[20px] font-bold">Creative Audit</h3>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Protocol: {selectedCamp.template_id}</p>
                     </div>
                     <button onClick={() => setSelectedCamp(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <XCircle size={20} />
                     </button>
                  </div>

                  <div className="space-y-8">
                     {/* AUDIT METADATA */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                           <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Target Campus</p>
                           <p className="text-[13px] font-bold text-white">{selectedCamp.campus || 'Trinity Core'}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                           <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Launch Slot</p>
                           <p className="text-[13px] font-bold text-white">{selectedCamp.schedule_slot || 'Standard'}</p>
                        </div>
                     </div>

                     {/* THE PREVIEW RENDER */}
                     <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
                        <div className="space-y-4">
                           <h4 className="text-[24px] font-bold text-white tracking-widest leading-tight">{selectedCamp.creative?.headline}</h4>
                           <p className="text-white/40 text-[14px] leading-relaxed">{selectedCamp.creative?.caption}</p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <p className="text-[18px] font-bold text-white">RM {selectedCamp.item?.price?.toFixed(2)}</p>
                           <div className="px-6 py-3 bg-accent text-[11px] font-bold rounded-full text-white uppercase tracking-widest shadow-md shadow-accent/20">
                              {selectedCamp.creative?.cta_text}
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-900/10 p-6 rounded-[2.5rem] border border-blue-500/20 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900/20 flex items-center justify-center text-blue-400">
                           <TrendingUp size={20} />
                        </div>
                        <div>
                           <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Est. Campus Reach</p>
                           <p className="text-[13px] font-bold text-white">850-1,200 Students</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button 
                        onClick={() => handleAuthorize(selectedCamp.id)}
                        className="flex-1 h-16 bg-white text-navy rounded-full font-bold text-[13px] uppercase tracking-widest shadow-md shadow-white/10 active:scale-95 transition-all"
                     >
                        Authorize Sync
                     </button>
                     <button 
                        onClick={() => handleReject(selectedCamp.id)}
                        className="h-16 px-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-bold text-[13px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                     >
                        Reject
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
