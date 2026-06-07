'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, serverTimestamp, runTransaction, query, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, ArrowDownToLine, History, Receipt, X, Loader2, CalendarRange } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function RunnerWalletPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'OVERALL' | 'TODAY'>('OVERALL');

  useEffect(() => {
    let unsubProfile: any;
    let unsubTransactions: any;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
        const q = query(collection(db, 'users', user.uid, 'transactions'));
        unsubTransactions = onSnapshot(q, (snapshot) => {
          setTransactions(snapshot.docs.map(d => d.data()));
        });
      } else {
        router.push('/auth');
      }
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTransactions) unsubTransactions();
    };
  }, [router]);

  const todaysEarnings = useMemo(() => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-GB', { month: 'short' });
    const year = now.getFullYear();
    const todayStr = `${day} ${month} ${year}`;

    return transactions
      .filter(tx => tx.type === 'EARNING' && tx.date?.includes(todayStr))
      .reduce((sum, tx) => sum + (tx.price || 0), 0);
  }, [transactions]);

  const handleWithdraw = async () => {
    if (!auth.currentUser || !amount) return;
    const withdrawVal = parseFloat(amount);
    if (withdrawVal > (profile?.balance || 0)) {
      alert('Insufficient balance.');
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        const currentBalance = snap.data()?.balance || 0;
        const newBalance = currentBalance - withdrawVal;
        tx.update(userRef, { balance: newBalance });
        const payoutRef = doc(collection(db, 'payout_requests'));
        tx.set(payoutRef, {
          user_id: auth.currentUser!.uid,
          user_name: profile?.full_name || 'Runner',
          amount: withdrawVal,
          net_payout: withdrawVal,
          status: 'pending',
          created_at: Date.now(),
          type: 'WITHDRAWAL'
        });
        const txRef = doc(collection(db, 'users', auth.currentUser!.uid, 'transactions'));
        tx.set(txRef, {
          item: 'Withdrawal Request',
          price: -withdrawVal,
          latest_balance: newBalance,
          type: 'WITHDRAWAL',
          date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          timestamp: serverTimestamp()
        });
      });
      setIsWithdrawOpen(false);
      setAmount('');
    } catch (e) {
      alert('Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 antialiased pb-40">
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-xl font-bold tracking-tight">My Wallet</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
      </nav>

      <div className="pt-28 px-6 space-y-10">
        <div className="space-y-6">
           <div className="bg-gray-50 p-10 rounded-2xl border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
             <div className="relative z-10 text-center space-y-2">
               <button 
                 onClick={() => setViewMode(v => v === 'OVERALL' ? 'TODAY' : 'OVERALL')}
                 className="flex items-center justify-center gap-1.5 mx-auto text-[11px] font-bold text-gray-400 uppercase tracking-widest active:scale-95 transition-all"
               >
                 {viewMode === 'OVERALL' ? 'Available Balance' : "Today's Earnings"}
                 <ChevronRight size={12} strokeWidth={3} className="rotate-90" />
               </button>
                <div className="flex items-start justify-center gap-1 text-gray-900">
                  <span className="text-sm font-semibold text-gray-400 pt-1">RM</span>
                 <motion.span key={viewMode} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tighter leading-none">
                   {(viewMode === 'OVERALL' ? (profile?.balance || 0) : todaysEarnings).toFixed(2)}
                 </motion.span>
               </div>
             </div>
           </div>

           <div className="flex">
             <button onClick={() => setIsWithdrawOpen(true)} className="w-full h-16 bg-white rounded-full flex items-center justify-center gap-3 border border-gray-100 active:bg-gray-50 active:scale-95 transition-all shadow-sm">
               <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                 <ArrowDownToLine size={16} strokeWidth={3} />
               </div>
               <span className="text-sm font-bold text-gray-900">Withdraw Funds</span>
             </button>
           </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[15px] font-bold tracking-tight px-1 uppercase text-gray-400">Activity</h2>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'Transaction History', icon: History, path: '/run/wallet/transactions' },
              { label: 'Withdrawal History', icon: History, path: '/run/wallet/history' },
            ].map((item, idx) => (
              <button key={idx} onClick={() => item.path !== '#' && router.push(item.path)}
                className={`w-full flex items-center justify-between p-5 active:bg-gray-50 transition-all ${idx === 0 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-400"><item.icon size={20} /></div>
                  <span className="text-[15px] font-bold text-gray-800">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-200 flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWithdrawOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="relative w-full max-w-md bg-white p-8 rounded-t-[32px] space-y-8 shadow-xl border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Withdrawal</h2>
                <button onClick={() => setIsWithdrawOpen(false)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><X size={18} /></button>
              </div>
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-gray-500">Available: RM {(profile?.balance || 0).toFixed(2)}</p>
                  <div className="flex items-start justify-center gap-1.5">
                     <span className={`text-sm font-semibold pt-2 ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-red-400' : 'text-gray-400'}`}>RM</span>
                     <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`bg-transparent text-5xl font-bold text-gray-900 outline-none placeholder:text-gray-100 tracking-tighter w-full max-w-[200px] text-center ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-red-500' : ''}`} />
                  </div>
                </div>
                <button onClick={() => setAmount(profile?.balance?.toString() || '0')} className="flex items-center justify-center mx-auto py-2 px-5 bg-gray-50 border border-gray-100 rounded-full text-[12px] font-bold text-gray-500 active:scale-95 transition-all">Withdraw all</button>
              </div>
              <button onClick={handleWithdraw} disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (profile?.balance || 0)} className="w-full h-14 bg-gray-900 text-white rounded-full font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 transition-all shadow-lg">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Withdrawal'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
