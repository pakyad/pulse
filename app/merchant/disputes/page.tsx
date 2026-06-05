"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  ShieldAlert, ChevronRight, CheckCircle2, 
  MessageSquare, AlertCircle, Loader2, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DisputeThread from '../../../components/merchant/DisputeThread';

// ── SKIBIDI TYPOGRAPHY (From MobileMerchant DNA) ──
const SkibidiHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">{children}</h1>
);

const SkibidiSubtext = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">{children}</p>
);

export default function MerchantDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const uSnap = await getDoc(doc(db, "users", user.uid));
      const uData = uSnap.data();
      if (uData?.role !== 'CLUB' && !uData?.is_verified_merchant) {
        router.push('/me');
        return;
      }

      const q = query(collection(db, 'disputes'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
          const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setDisputes(sortedData);
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => unsubAuth();
  }, [router]);

  const pendingDisputes = disputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'SETTLED');
  const resolvedDisputes = disputes.filter(d => d.status === 'RESOLVED' || d.status === 'SETTLED');
  const currentList = activeTab === 'PENDING' ? pendingDisputes : resolvedDisputes;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin text-slate-900" size={32} />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans antialiased pb-40">
      
      {/* ── SIMPLE HEADER ── */}
      <header className="px-8 py-8 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()} 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 border border-slate-100 transition-all"
              >
                 <ChevronLeft size={18} />
              </button>
              <div className="space-y-1">
                 <h1 className="text-[17px] font-bold tracking-tight">Problems</h1>
                 <p className="text-[11px] font-medium text-[#94a3b8]">History & Status</p>
              </div>
           </div>
        </div>
      </header>

      <div className="px-8 py-10 max-w-2xl mx-auto space-y-10">
         
         {/* ── SHARP STATS ── */}
         <section className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
               <p className="text-[10px] font-semibold text-[#94a3b8]  leading-none">Solved</p>
               <div className="space-y-0.5">
                  <p className="text-[22px] font-bold tracking-tighter leading-none">{resolvedDisputes.length}</p>
               </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 shadow-sm">
               <p className="text-[10px] font-semibold text-white/40  leading-none">To Fix</p>
               <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                     <p className="text-[22px] font-bold tracking-tighter leading-none">{pendingDisputes.length}</p>
                     {pendingDisputes.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                     )}
                  </div>
               </div>
            </div>
         </section>

         {/* ── MINIMALIST TABS (Matched to Orders Page) ── */}
         <section className="flex items-center gap-8 border-b border-slate-50">
            {[
              { id: 'PENDING', label: 'Active' },
              { id: 'RESOLVED', label: 'History' }
            ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`pb-4 text-[15px] font-bold transition-all relative ${
                    activeTab === tab.id 
                    ? 'text-slate-900' 
                    : 'text-[#94a3b8] hover:text-slate-900'
                 }`}
               >
                 {tab.label}
                 {activeTab === tab.id && (
                    <motion.div 
                       layoutId="activeTab"
                       className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                    />
                 )}
               </button>
            ))}
         </section>

         {/* ── SHARP LIST ── */}
         <section className="space-y-4">
            {currentList.length === 0 ? (
               <div className="py-24 text-center flex flex-col items-center justify-center space-y-4 opacity-40">
                  <CheckCircle2 size={32} className="text-[#94a3b8]" />
                  <p className="text-[11px] font-bold  text-[#94a3b8]">All Clear</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {currentList.map((dispute, idx) => (
                     <motion.div 
                       key={dispute.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       onClick={() => setSelectedDispute(dispute)}
                       className="p-6 bg-white border border-slate-100 rounded-2xl flex flex-col gap-5 shadow-sm hover:border-slate-200 transition-all cursor-pointer group"
                     >
                        <div className="flex justify-between items-start">
                           <div className="flex gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                 dispute.status === 'MERCHANT_RESPONDED' 
                                 ? 'bg-blue-50 border-blue-100 text-slate-900' 
                                 : 'bg-red-50 border-red-100 text-red-500'
                              }`}>
                                 {dispute.status === 'MERCHANT_RESPONDED' ? <MessageSquare size={18} /> : <AlertCircle size={18} />}
                              </div>
                              <div className="space-y-1.5 mt-0.5">
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-[15px] font-bold tracking-tight">{dispute.reporter_name}</h4>
                                    <span className="text-[9px] font-bold text-[#94a3b8]  bg-slate-50 px-2 py-0.5 rounded border border-slate-100">#{dispute.order_code}</span>
                                 </div>
                                 <p className="text-[13px] font-medium text-[#64748b] leading-relaxed line-clamp-2">
                                    {dispute.reason}: {dispute.narrative}
                                 </p>
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900 transition-colors shrink-0 mt-2" />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <span className="text-[10px] font-bold text-[#94a3b8] ">
                              {dispute.created_at?.toDate ? dispute.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : 'Pending'}
                           </span>
                           <div className="flex items-center gap-1.5">
                              <div className={`w-1 h-1 rounded-full ${dispute.status === 'MERCHANT_RESPONDED' ? 'bg-slate-900' : 'bg-red-500 animate-pulse'}`} />
                              <span className={`text-[9px] font-semibold ${dispute.status === 'MERCHANT_RESPONDED' ? 'text-slate-900' : 'text-red-500'}`}>
                                 {dispute.status === 'MERCHANT_RESPONDED' ? 'Under Review' : 'To Fix'}
                              </span>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </div>
            )}
         </section>
      </div>

      {/* ── OVERLAY ── */}
      <AnimatePresence>
        {selectedDispute && (
          <DisputeThread 
            dispute={selectedDispute}
            onClose={() => setSelectedDispute(null)}
          />
        )}
      </AnimatePresence>

    </main>
  );
}
