'use client'
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { ChevronLeft, Filter, Calendar, Loader2, Wallet, Banknote, Landmark, Package, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import BackButton from '@/components/shared/BackButton';

export default function TransactionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'type' | 'month' | null>(null);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
        const q = query(collection(db, 'users', user.uid, 'transactions'));
        
        return onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
          setTransactions(list);
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

  const getIcon = (type: string, item: string) => {
    const lowerItem = (item || '').toLowerCase();
    if (type === 'WITHDRAWAL') return <Landmark size={20} />;
    if (type === 'TOPUP') return <Banknote size={20} />;
    if (lowerItem.includes('payout')) return <Landmark size={20} />;
    if (lowerItem.includes('fee') || lowerItem.includes('parcel')) return <Package size={20} />;
    if (lowerItem.includes('tip')) return <Gift size={20} />;
    return <Wallet size={20} />;
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      if (tx.date) {
        const parts = tx.date.split(' ');
        if (parts.length >= 3) months.add(`${parts[1]} ${parts[2].replace(',', '')}`);
      }
    });
    return Array.from(months);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;
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
    <main className="min-h-screen bg-[#F9F9FB] text-gray-900 antialiased pb-20 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton fallback="/run/wallet" />
          <p className="text-xl font-bold tracking-tight">Transactions</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 px-6 flex gap-2 mb-6">
        <button onClick={() => setActiveFilter('type')} className={`h-10 px-4 rounded-full border text-[12px] font-bold flex items-center gap-2 transition-all ${selectedType !== 'ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-100 text-gray-500'}`}>
          {getTypeLabel(selectedType)} <Filter size={14} />
        </button>
        <button onClick={() => setActiveFilter('month')} className={`h-10 px-4 rounded-full border text-[12px] font-bold flex items-center gap-2 transition-all ${selectedMonth !== 'ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-100 text-gray-500'}`}>
          {selectedMonth === 'ALL' ? 'All Months' : selectedMonth} <Calendar size={14} />
        </button>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-200" size={32} /></div>
        ) : error ? (
          <div className="py-20 text-center px-10 space-y-3"><p className="text-sm font-bold text-red-500">Query Error</p><p className="text-xs text-gray-400 leading-relaxed">{error}</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center space-y-3"><p className="text-sm font-bold text-gray-400">No transactions found</p></div>
        ) : (
          filteredTransactions.map((tx) => {
            const isPositive = tx.price > 0;
            return (
              <div key={tx.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all active:scale-[0.98]">
                <div className="flex gap-4 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                    {getIcon(tx.type, tx.item)}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight">{tx.item || 'Reward'}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-widest">{tx.date}</p>
                  </div>
                </div>
                <p className={`text-[15px] font-bold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {isPositive ? '+' : ''}RM {tx.price.toFixed(2)}
                </p>
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
                <h2 className="text-lg font-bold text-gray-900">{activeFilter === 'type' ? 'Filter by Type' : 'Filter by Month'}</h2>
                <button onClick={() => setActiveFilter(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {activeFilter === 'type' ? (
                  ['ALL', 'EARNING', 'WITHDRAWAL', 'TOPUP'].map(id => (
                    <button key={id} onClick={() => { setSelectedType(id); setActiveFilter(null); }}
                      className={`w-full h-14 rounded-2xl font-bold text-sm transition-all border ${selectedType === id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100'}`}>
                      {getTypeLabel(id)}
                    </button>
                  ))
                ) : (
                  <>
                    <button onClick={() => { setSelectedMonth('ALL'); setActiveFilter(null); }} className={`w-full h-14 rounded-2xl font-bold text-sm transition-all border ${selectedMonth === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100'}`}>All Months</button>
                    {availableMonths.map(month => (
                      <button key={month} onClick={() => { setSelectedMonth(month); setActiveFilter(null); }} className={`w-full h-14 rounded-2xl font-bold text-sm transition-all border ${selectedMonth === month ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-100'}`}>{month}</button>
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
