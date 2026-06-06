'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, serverTimestamp, runTransaction, query, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Plus, ArrowDownToLine, History, Receipt, X, Loader2, CalendarRange, Landmark } from 'lucide-react';
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
      
      {/* ── GLOBAL NAVIGATION ── */}
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
        
        {/* ── BALANCE CARD (WITH TOGGLE) ── */}
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
                 <span className="text-[21px] font-bold mt-1.5">RM</span>
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

           {/* ── ACTIONS ── */}
           <div className="flex">
             <button onClick={() => setIsWithdrawOpen(true)} className="w-full h-16 bg-white rounded-[20px] flex items-center justify-center gap-2 border-[1.5px] border-slate-100 active:bg-slate-50 active:scale-95 transition-all shadow-sm">
               <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                 <ArrowDownToLine size={16} strokeWidth={3} />
               </div>
               <span className="text-[13px] font-bold text-slate-900">Withdraw</span>
             </button>
           </div>
        </div>

        {/* ── MENU LIST ── */}
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

      {/* ── MODALS (TOP UP / WITHDRAW) ── */}
      <AnimatePresence>
        {(isTopUpOpen || isWithdrawOpen) && (
          <div className="fixed inset-0 z-200 flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => { setIsTopUpOpen(false); setIsWithdrawOpen(false); }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" />
            
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-8 space-y-6 shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{isTopUpOpen ? 'Add Funds' : 'Withdrawal'}</h2>
                <button onClick={() => { setIsTopUpOpen(false); setIsWithdrawOpen(false); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Main Interaction Area */}
              {isWithdrawOpen && (profile?.balance || 0) <= 0 ? (
                <div className="py-6 text-center space-y-3">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                     <Landmark size={32} />
                   </div>
                   <p className="text-[14px] font-bold text-slate-400 max-w-[200px] mx-auto leading-relaxed">No available capital.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center relative">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Amount in RM</span>
                    <div className="flex items-center justify-center gap-2 mt-1">
                       <span className={`text-[24px] font-bold transition-colors ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-rose-500' : 'text-slate-200'}`}>RM</span>
                       <input 
                         type="number" 
                         value={amount} 
                         onChange={(e) => setAmount(e.target.value)} 
                         placeholder="0.00"
                         className={`bg-transparent text-[42px] font-bold text-slate-900 outline-none placeholder:text-slate-100 tracking-tighter w-full max-w-[180px] text-center transition-colors ${parseFloat(amount) > (profile?.balance || 999999) ? 'text-rose-500' : ''}`} 
                       />
                    </div>
                  </div>
                  
                    <button 
                      onClick={() => setAmount(profile?.balance?.toString() || '0')}
                      className="flex items-center justify-center mx-auto py-1.5 px-4 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] hover:bg-slate-100 hover:text-slate-900 transition-all"
                    >
                      Withdraw All
                    </button>
                </div>
              )}

              {/* Functional Button */}
              <button 
                onClick={isTopUpOpen ? handleTopUp : handleWithdraw}
                disabled={loading || !amount || parseFloat(amount) <= 0 || (isWithdrawOpen && parseFloat(amount) > (profile?.balance || 0))}
                className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-30 disabled:grayscale"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>
                      {isTopUpOpen ? 'Authorize Injection' : 
                       (profile?.balance || 0) <= 0 ? 'Zero Balance' :
                       parseFloat(amount) > (profile?.balance || 0) ? 'Insufficient Capital' : 
                       'Authorize Withdrawal'}
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
