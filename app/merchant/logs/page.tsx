'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, ClipboardList, Package } from 'lucide-react';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function MerchantLogsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', user.uid));
        setProfile({ ...snap.data(), uid: user.uid });

        const q = query(
          collection(db, "orders"),
          where("seller_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        onSnapshot(q, (snapshot) => {
          setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  const filteredOrders = useMemo(() => {
    if (filter === 'All') return orders;
    if (filter === 'Active') return orders.filter(o => ['PAID', 'PREPARING', 'READY', 'RUNNER_ASSIGNED', 'PICKED_UP'].includes(o.status));
    if (filter === 'Completed') return orders.filter(o => o.status === 'DELIVERED');
    if (filter === 'Cancelled') return orders.filter(o => o.status === 'CANCELLED');
    return orders;
  }, [orders, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-[#FEF3C7] text-[#92400E]';
      case 'PREPARING': return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'READY': return 'bg-[#D1FAE5] text-[#065F46]';
      case 'RUNNER_ASSIGNED': return 'bg-[#EDE9FE] text-[#4C1D95]';
      case 'PICKED_UP': return 'bg-[#CFFAFE] text-[#164E63]';
      case 'DELIVERED': return 'bg-[#F3F4F6] text-[#374151]';
      case 'CANCELLED': return 'bg-[#FEE2E2] text-[#991B1B]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans antialiased">
      <header className="px-10 py-8 bg-white border-b border-slate-100 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[24px] font-semibold text-[#111827] tracking-tight">Log</h1>
            <p className="text-[13px] text-[#6B7280]">Order history</p>
          </div>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Merchant'} />
      </header>

      <main className="max-w-7xl mx-auto px-10 py-12 space-y-8">
        <div className="flex gap-2 sticky top-[104px] z-40 bg-[#F8F9FA] py-2">
          {['All', 'Active', 'Completed', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-[18px] py-[8px] rounded-full text-[13px] font-medium transition-all ${filter === tab ? 'bg-[#111827] text-white' : 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Date & Time</th>
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Order Code</th>
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Buyer Name</th>
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Item Name</th>
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Amount</th>
                <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((o, idx) => (
                <tr key={o.id} className={idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}>
                  <td className="px-8 py-5 text-[13px] font-medium text-[#6B7280]">
                    {o.created_at?.toDate ? o.created_at.toDate().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                  </td>
                  <td className="px-8 py-5 text-[13px] font-mono font-bold text-[#6B7280]">#{o.id.slice(-6).toUpperCase()}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#111827]">{o.customer_name || 'Student'}</td>
                  <td className="px-8 py-5 text-[13px] font-medium text-[#374151]">{o.title}</td>
                  <td className="px-8 py-5 text-[13px] font-bold text-[#111827] text-right">RM {Number(o.total || o.price || 0).toFixed(2)}</td>
                  <td className="px-8 py-5">
                    <span className={`px-[10px] py-[3px] rounded-[20px] text-[11px] font-medium ${getStatusColor(o.status)}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-[#6B7280] text-[13px] font-medium">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
