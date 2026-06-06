'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { ChevronLeft, Filter, ArrowDownToLine, CheckCircle2, Timer, Landmark, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function PayoutHistoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [activeFilter, setActiveFilter] = useState<'status' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
        const q = query(
          collection(db, 'payout_requests'),
          where('user_id', '==', user.uid)
        );
        return onSnapshot(q, 
          (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
            setRequests(list);
            setLoading(false);
          },
          (err) => {
            console.error("Firestore Query Error:", err);
            setError(err.message);
            setLoading(false);
          }
        );
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  const filteredRequests = useMemo(() => {
    if (selectedStatus === 'ALL') return requests;
    return requests.filter(r => r.status?.toUpperCase() === selectedStatus);
  }, [requests, selectedStatus]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return 'All Status';
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-20">
      
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-[14px] font-bold tracking-tight">Withdrawal History</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      {/* ── FILTERS ── */}
      <div className="pt-28 px-6 flex gap-2 border-b border-slate-50 pb-4">
        <button 
          onClick={() => setActiveFilter('status')}
          className={`h-10 px-4 bg-white rounded-xl border-[0.5px] text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all ${selectedStatus !== 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {getStatusLabel(selectedStatus)} <Filter size={14} />
        </button>
      </div>

      {/* ── LIST ── */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <div className="py-20 flex justify-center">
             <Loader2 className="animate-spin text-slate-200" size={32} />
          </div>
        ) : error ? (
           <div className="py-20 text-center px-10 space-y-3">
             <p className="text-[14px] font-bold text-red-500">Query Error</p>
             <p className="text-[11px] text-slate-400 leading-relaxed">{error}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center space-y-3">
             <p className="text-[14px] font-bold text-slate-400">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isCompleted = req.status === 'completed' || req.status === 'approved';
            const isCancelled = req.status === 'cancelled';
            return (
              <div key={req.id} className="py-4 flex items-start justify-between active:bg-slate-50 transition-colors px-6 group">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : isCancelled ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                     <ArrowDownToLine size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-none">Withdrawal Request</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-[11px] font-medium text-[#94a3b8]">{formatDate(req.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[15px] font-black tracking-tight text-slate-900">
                    -RM {req.amount.toFixed(2)}
                  </p>
                  <div className={`inline-flex items-center justify-end w-full gap-1 text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isCompleted ? 'text-emerald-500' : isCancelled ? 'text-rose-500' : 'text-amber-500'}`}>
                    {isCompleted ? <CheckCircle2 size={10} /> : <Timer size={10} />}
                    {req.status}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── FILTER BOTTOM SHEET ── */}
      <AnimatePresence>
        {activeFilter && (
          <div className="fixed inset-0 z-200 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setActiveFilter(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Filter by Status</h2>
                <button onClick={() => setActiveFilter(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-95">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ALL', label: 'All Status' },
                  { id: 'PENDING', label: 'In Progress' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'CANCELLED', label: 'Cancelled' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setSelectedStatus(opt.id); setActiveFilter(null); }}
                    className={`w-full flex items-center justify-center p-4 rounded-[20px] font-bold text-[13px] transition-all active:scale-[0.98] ${selectedStatus === opt.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 border-[1.5px] border-slate-100 hover:border-slate-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
