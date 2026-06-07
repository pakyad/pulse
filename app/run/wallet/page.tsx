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
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // View state for balance card
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
    // Current date in "DD MMM YYYY" format to match seeded data (e.g. "06 Jun 2026")
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('en-GB', { month: 'short' });
    const year = now.getFullYear();
    const todayStr = `${day} ${month} ${year}`;

    return transactions
      .filter(tx => tx.type === 'EARNING' && tx.date?.includes(todayStr))
      .reduce((sum, tx) => sum + (tx.price || 0), 0);
  }, [transactions]);

  const handleTopUp = async () => {
    if (!auth.currentUser || !amount) return;
    setLoading(true);
    try {
      const topUpVal = parseFloat(amount);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        const currentBalance = snap.data()?.balance || 0;
        const newBalance = currentBalance + topUpVal;
        tx.update(userRef, { balance: newBalance });
        
        const txRef = doc(collection(db, 'users', auth.currentUser!.uid, 'transactions'));
        tx.set(txRef, {
          item: 'Wallet Top Up',
          price: topUpVal,
          latest_balance: newBalance,
          type: 'TOPUP',
          date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          timestamp: serverTimestamp()
        });
      });

      setIsTopUpOpen(false);
      setAmount('');
    } catch (e) {
      alert('Top up failed.');
    } finally {
      setLoading(false);
    }
  };

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
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      
      {/*  GLOBAL NAVIGATION  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-[14px] font-bold tracking-tight">My Wallet</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
      </nav>

      <div className="pt-28 px-6 space-y-10">
        
        {/*  BALANCE CARD (WITH TOGGLE)  */}
        <div className="space-y-6">
           <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-xs">
             
             <div className="relative z-10 text-center space-y-2">
               <button 
                 onClick={() => setViewMode(v => v === 'OVERALL' ? 'TODAY' : 'OVERALL')}
                 className="flex items-center justify-center gap-1.5 mx-auto text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest active:scale-95 transition-all"
               >
                 {viewMode === 'OVERALL' ? 'Available Balance' : "Today's Earnings"}
                 <ChevronRight size={12} strokeWidth={3} className="rotate-90" />
               </button>
                <div className="flex items-start justify-center gap-1 text-slate-900">
                  <span className="text-sm font-semibold text-slate-400 pt-1">RM</span>
                 <motion.span 
                    key={viewMode}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[56px] font-black tracking-tighter leading-none"
                 >
                   {(viewMode === 'OVERALL' ? (profile?.balance || 0) : todaysEarnings).toFixed(2)}
                 </motion.span>
               </div>
             </div>
           </div>

           {/*  ACTIONS  */}
           <div className="flex">
             <button onClick={() => setIsWithdrawOpen(true)} className="w-full h-16 bg-white rounded-[20px] flex items-center justify-center gap-2 border-[1.5px] border-slate-100 active:bg-slate-50 active:scale-95 transition-all shadow-sm">
               <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                 <ArrowDownToLine size={16} strokeWidth={3} />
               </div>
               <span className="text-[13px] font-bold text-slate-900">Withdraw</span>
             </button>
           </div>
        </div>

        {/*  MENU LIST  */}
        <div className="space-y-1">
          <h2 className="text-[15px] font-bold tracking-tight px-1 mb-4">Activity</h2>
          <div className="px-2">
            {[
              { label: 'Transaction History', icon: History, path: '/run/wallet/transactions' },
              { label: 'Withdrawal History', icon: History, path: '/run/wallet/history' },
            ].map((item, idx) => (
              <button key={idx} onClick={() => item.path !== '#' && router.push(item.path)}
                className="w-full flex items-center justify-between py-4 active:opacity-70 transition-all border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-slate-400`}>
                    <item.icon size={22} strokeWidth={2} />
                  </div>
                  <span className="text-[15px] font-bold text-slate-800">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/*  MODALS (TOP UP / WITHDRAW)  */}
      <AnimatePresence>
        {(isTopUpOpen || isWithdrawOpen) && (
          <div className="fixed inset-0 z-200 flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => { setIsTopUpOpen(false); setIsWithdrawOpen(false); }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" />
            
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-slate-50 p-10 rounded-[32px] space-y-8 shadow-sm overflow-hidden border border-slate-100"
            >
              {/* Shine overlay */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between relative z-10">
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">{isTopUpOpen ? 'Top Up' : 'Withdrawal'}</h2>
                <button onClick={() => { setIsTopUpOpen(false); setIsWithdrawOpen(false); }} className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-400 active:scale-95 transition-all shadow-sm">
                  <X size={18} />
                </button>
              </div>

              {/* Main Interaction Area */}
              <div className="space-y-8 relative z-10">
                <div className="text-center space-y-4">
                  <p className="text-[13px] font-semibold text-slate-500">Available: RM {(profile?.balance || 0).toFixed(2)}</p>
                  <div className="flex items-start justify-center gap-1.5">
                     <span className={`text-sm font-semibold pt-1 transition-colors ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-rose-400' : 'text-slate-400'}`}>RM</span>
                     <input 
                       type="number" 
                       value={amount} 
                       onChange={(e) => setAmount(e.target.value)} 
                       placeholder="0.00"
                       className={`bg-transparent text-[56px] font-black text-slate-900 outline-none placeholder:text-slate-200/50 tracking-tighter w-full max-w-[220px] text-center transition-colors ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-rose-500' : ''}`} 
                     />
                  </div>
                  <span className="block text-[12px] font-medium text-slate-400">Enter amount to withdraw</span>
                </div>
                
                  <button 
                    onClick={() => setAmount(profile?.balance?.toString() || '0')}
                    className="flex items-center justify-center mx-auto py-2 px-5 bg-white border border-slate-100 rounded-full text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-all shadow-sm"
                  >
                    Withdraw all
                  </button>
              </div>

              {/* Functional Button */}
              <button 
                onClick={isTopUpOpen ? handleTopUp : handleWithdraw}
                disabled={loading || !amount || parseFloat(amount) <= 0 || (isWithdrawOpen && parseFloat(amount) > (profile?.balance || 0))}
                className="relative z-10 w-full h-14 bg-slate-900 text-white rounded-[20px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-30 disabled:grayscale overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>
                      {isTopUpOpen ? 'Top Up' : 
                       (profile?.balance || 0) <= 0 ? 'Insufficient Capital' :
                       parseFloat(amount) > (profile?.balance || 0) ? 'Insufficient Capital' : 
                       'Withdraw'}
                    </span>
                    {!loading && <ChevronRight size={16} strokeWidth={3} />}
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
