"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  History,
  Lock,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLedgerPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Gated Access: Ensure ONLY Admins can see the Treasury
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.data()?.role !== 'ADMIN') {
          router.push('/home'); 
        }
      } else {
        router.push('/auth');
      }
    });

    // 2. Fetch Pending Payout Requests
    const qPending = query(collection(db, "payout_requests"));
    const unsub = onSnapshot(qPending, (sn) => {
       const list = sn.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
       setRequests(list.filter(r => r.status === 'pending'));
       setHistory(list.filter(r => r.status !== 'pending'));
       setLoading(false);
    });

    return () => { unsubAuth(); unsub(); };
  }, []);

  const handleAuthorizePayout = async (request: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "payout_requests", request.id);
        transaction.update(reqRef, {
           status: 'approved',
           processed_at: Date.now(),
           processed_by: auth.currentUser?.uid
        });
        
        // Note: Real balance adjustment would happen here or in a Cloud Function
      });
      alert(`TREASURY SYNC: Payout of RM ${request.net_payout.toFixed(2)} authorized.`);
    } catch (e) {
      alert("Fiscal Handshake Failed.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A1121] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#060B16] text-white p-8 md:p-16 font-sans antialiased">
      
      {/* TREASURY HEADER */}
      <div className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                 <ShieldCheck size={18} />
               </div>
               <p className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/40">Pulse Global Treasury</p>
            </div>
            <h1 className="text-[36px] font-bold tracking-tight">Global Finance Ledger</h1>
         </div>
         
         <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/admin/prestige')}
              className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[12px] font-bold text-white/40 hover:text-white transition-all"
            >
               Promotion Admin
            </button>
            <div className="h-10 w-px bg-white/10" />
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-8">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-white/40  mb-1">Pulse Fee (10%)</p>
                  <p className="text-[20px] font-bold text-emerald-500">RM 48.50</p>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
         
         {/* PENDING LEDGER */}
         <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-end mb-6">
               <h3 className="text-[14px] font-bold text-white/20 ">Pending Reconciliations</h3>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {requests.length === 0 ? (
               <div className="py-32 text-center bg-white/5 rounded-[4rem] border border-white/5">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10 mb-6">
                     <CheckCircle2 size={40} />
                  </div>
                  <p className="text-[13px] font-bold text-white/20 ">Ledger Pulse Clean</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {requests.map((req) => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 border border-white/5 p-8 rounded-[3rem] hover:bg-white/8 transition-all group"
                    >
                       <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                <Building2 size={24} />
                             </div>
                             <div>
                                <h4 className="text-[18px] font-bold tracking-tight">{req.merchant_name}</h4>
                                <p className="text-[11px] font-bold text-white/20 ">Institutional Provider</p>
                             </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold  border border-emerald-500/20">
                             Awaiting Auth
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-8 mb-8 p-6 bg-white/5 rounded-2xl">
                          <div>
                             <p className="text-[9px] font-bold text-white/20  mb-1">Gross Revenue</p>
                             <p className="text-[16px] font-bold tracking-widest text-white">RM {req.total_revenue.toFixed(2)}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-white/20  mb-1">Pulse Fee (10%)</p>
                             <p className="text-[16px] font-bold tracking-widest text-red-400">- RM {req.pulse_fee.toFixed(2)}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-white/20  mb-1">Net Payout</p>
                             <p className="text-[20px] font-bold tracking-tighter text-emerald-500">RM {req.net_payout.toFixed(2)}</p>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <button 
                            onClick={() => handleAuthorizePayout(req)}
                            className="flex-1 h-14 bg-white text-navy rounded-full font-bold text-[13px]  active:scale-95 transition-all shadow-md shadow-white/5"
                          >
                             Authorize Fund Transfer
                          </button>
                          <button className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 transition-all">
                             <XCircle size={18} />
                          </button>
                       </div>
                    </motion.div>
                  ))}
               </div>
            )}
         </div>

         {/* TREASURY SUMMARY */}
         <div className="lg:col-span-4 space-y-8">
            <h3 className="text-[14px] font-bold text-white/20 ">Fiscal Oversight</h3>
            
            <div className="space-y-4">
               <div className="bg-white/5 border border-white/5 p-8 rounded-[3.5rem] space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                       <Wallet size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-white/40 ">Platform Vault</p>
                       <p className="text-[16px] font-bold">RM 12,480.00</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <p className="text-[11px] text-white/20 leading-relaxed font-medium">Platform vault holds all student payments until merchant reconciliation is requested and authorized.</p>
                     <div className="h-px bg-white/5" />
                     <div className="flex justify-between items-center">
                        <p className="text-[12px] font-bold text-white/40">Fiscal Health</p>
                        <p className="text-[12px] font-semibold text-emerald-500">OPTIMAL</p>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-900/10 rounded-[3.5rem] border border-blue-500/20 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900/20 flex items-center justify-center text-blue-400">
                       <History size={20} />
                    </div>
                    <p className="text-[13px] font-bold text-white">Recent Settlements</p>
                  </div>
                  
                  <div className="space-y-4 opacity-50">
                     {history.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex justify-between items-center">
                           <div>
                              <p className="text-[11px] font-bold text-white">{h.merchant_name}</p>
                              <p className="text-[9px] font-bold text-white/40 ">Authorized</p>
                           </div>
                           <p className="text-[13px] font-bold text-emerald-500">RM {h.net_payout?.toFixed(2)}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

      </div>

    </main>
  );
}
