'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { ChevronLeft, Filter, Calendar, Loader2, Wallet, Banknote, Landmark, Package, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function TransactionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [activeFilter, setActiveFilter] = useState<'type' | 'month' | null>(null);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
        const q = query(collection(db, 'users', user.uid, 'transactions'));
        
        return onSnapshot(q, 
          (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Manual sort by timestamp desc since index might be missing
            list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setTransactions(list);
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

  const getIcon = (type: string, item: string) => {
    const lowerItem = (item || '').toLowerCase();
    if (type === 'WITHDRAWAL') return <Landmark size={20} />;
    if (type === 'TOPUP') return <Banknote size={20} />;
    if (lowerItem.includes('payout')) return <Landmark size={20} />;
    if (lowerItem.includes('fee') || lowerItem.includes('parcel')) return <Package size={20} />;
    if (lowerItem.includes('tip')) return <Gift size={20} />;
    return <Wallet size={20} />;
  };

  // ── FILTER LOGIC ──
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      if (tx.date) {
        // Assuming format like "21 May 2026, 14:15"
        const parts = tx.date.split(' ');
        if (parts.length >= 3) {
          months.add(`${parts[1]} ${parts[2].replace(',', '')}`); // e.g. "May 2026"
        }
      }
    });
    return Array.from(months);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filter by Type
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
      
      // Filter by Month
      if (selectedMonth !== 'ALL' && tx.date) {
         const parts = tx.date.split(' ');
         if (parts.length >= 3) {
           const txMonth = `${parts[1]} ${parts[2].replace(',', '')}`;
           if (txMonth !== selectedMonth) return false;
         }
      }
      return true;
    });
  }, [transactions, selectedType, selectedMonth]);

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'EARNING': return 'Earnings';
      case 'WITHDRAWAL': return 'Withdrawals';
      case 'TOPUP': return 'Top Ups';
      default: return 'All Types';
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
          <p className="text-[14px] font-bold tracking-tight">Transaction History</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      {/* ── FILTERS ── */}
      <div className="pt-28 px-6 flex gap-2 border-b border-slate-50 pb-4">
        <button 
          onClick={() => setActiveFilter('type')}
          className={`h-10 px-4 rounded-xl border-[0.5px] text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all ${selectedType !== 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {getTypeLabel(selectedType)} <Filter size={14} />
        </button>
        <button 
          onClick={() => setActiveFilter('month')}
          className={`h-10 px-4 rounded-xl border-[0.5px] text-[12px] font-bold flex items-center gap-2 active:scale-95 transition-all ${selectedMonth !== 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {selectedMonth === 'ALL' ? 'All Months' : selectedMonth} <Calendar size={14} />
        </button>
      </div>

      {/* ── TRANSACTION LIST ── */}
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
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
             <p className="text-[14px] font-bold text-slate-400">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isPositive = tx.price > 0;
            return (
              <div key={tx.id} className="py-4 flex items-start justify-between active:bg-slate-50 transition-colors px-6 group">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                    {getIcon(tx.type, tx.item)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-none">{tx.item || 'Mission Reward'}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {tx.latest_balance !== undefined && (
                        <p className="text-[11px] font-medium text-[#94a3b8]">Latest Balance: RM {tx.latest_balance.toFixed(2)}</p>
                      )}
                      <p className="text-[11px] font-medium text-[#94a3b8]">{tx.date}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-black tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isPositive ? '+' : '-'}RM {Math.abs(tx.price).toFixed(2)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── FILTER BOTTOM SHEETS ── */}
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
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                  {activeFilter === 'type' ? 'Filter by Type' : 'Filter by Month'}
                </h2>
                <button onClick={() => setActiveFilter(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-95">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {activeFilter === 'type' ? (
                  <>
                    {[
                      { id: 'ALL', label: 'All Types' },
                      { id: 'EARNING', label: 'Earnings' },
                      { id: 'WITHDRAWAL', label: 'Withdrawals' },
                      { id: 'TOPUP', label: 'Top Ups' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => { setSelectedType(opt.id); setActiveFilter(null); }}
                        className={`w-full flex items-center justify-between p-4 rounded-[20px] font-bold text-[14px] transition-all active:scale-[0.98] ${selectedType === opt.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 border-[1.5px] border-slate-100 hover:border-slate-200'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button onClick={() => { setSelectedMonth('ALL'); setActiveFilter(null); }}
                      className={`w-full flex items-center justify-between p-4 rounded-[20px] font-bold text-[14px] transition-all active:scale-[0.98] ${selectedMonth === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 border-[1.5px] border-slate-100 hover:border-slate-200'}`}>
                      All Months
                    </button>
                    {availableMonths.map(month => (
                      <button key={month} onClick={() => { setSelectedMonth(month); setActiveFilter(null); }}
                        className={`w-full flex items-center justify-between p-4 rounded-[20px] font-bold text-[14px] transition-all active:scale-[0.98] ${selectedMonth === month ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 border-[1.5px] border-slate-100 hover:border-slate-200'}`}>
                        {month}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
