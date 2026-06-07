'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { ChevronLeft, Filter, ArrowDownToLine, CheckCircle2, Timer, Landmark, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import BackButton from '@/components/shared/BackButton';

export default function PayoutHistoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        return onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
          setRequests(list);
          setLoading(false);
        }, (err) => {
          console.error(err);
          setError(err.message);
          setLoading(false);
        });
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
    <main className="min-h-screen bg-[#F9F9FB] text-gray-900 antialiased pb-20 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton fallback="/run/wallet" />
          <p className="text-xl font-bold tracking-tight">Withdrawals</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 px-6 flex gap-2 border-b border-gray-100 pb-4">
        <button onClick={() => setActiveFilter('status')} className={`h-10 px-4 bg-white rounded-full border text-[12px] font-bold flex items-center gap-2 transition-all ${selectedStatus !== 'ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-100 text-gray-500'}`}>
          {getStatusLabel(selectedStatus)} <Filter size={14} />
        </button>
      </div>

      <div className="px-4 pt-6 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-200" size={32} /></div>
        ) : error ? (
           <div className="py-20 text-center px-10 space-y-3"><p className="text-sm font-bold text-red-500">Query Error</p><p className="text-xs text-gray-400 leading-relaxed">{error}</p></div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center space-y-3"><p className="text-sm font-bold text-gray-400">No requests found</p></div>
        ) : (
          filteredRequests.map((req) => {
            const isCompleted = req.status?.toLowerCase() === 'completed' || req.status?.toLowerCase() === 'approved';
            const isCancelled = req.status?.toLowerCase() === 'cancelled';
            return (
              <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all active:scale-[0.98]">
                <div className="flex gap-4 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : isCancelled ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                     <ArrowDownToLine size={20} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 tracking-tight leading-none">Withdrawal</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-widest">{formatDate(req.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold tracking-tight text-gray-900">-RM {req.amount.toFixed(2)}</p>
                  <div className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest mt-1 ${isCompleted ? 'text-emerald-500' : isCancelled ? 'text-rose-500' : 'text-amber-500'}`}>
                    {isCompleted ? <CheckCircle2 size={10} /> : <Timer size={10} />}
                    {req.status}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <AnimatePresence>
        {activeFilter && (
          <div className="fixed inset-0 z-200 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveFilter(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="relative w-full max-w-lg bg-white rounded-t-[32px] p-8 pb-12 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-gray-900">Filter by Status</h2>
                <button onClick={() => setActiveFilter(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'ALL', label: 'All Status' },
                  { id: 'PENDING', label: 'In Progress' },
                  { id: 'COMPLETED', label: 'Completed' },
                  { id: 'CANCELLED', label: 'Cancelled' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setSelectedStatus(opt.id); setActiveFilter(null); }}
                    className={`w-full h-14 rounded-2xl font-bold text-sm transition-all border ${selectedStatus === opt.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100'}`}>
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
