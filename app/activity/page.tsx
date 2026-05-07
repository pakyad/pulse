'use client'

import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2,
  Package,
  LayoutGrid,
  ClipboardList,
  User,
  ChevronRight,
  Search,
  ArrowLeft,
  MessageSquare,
  ArrowUpRight,
  MapPin,
  Star,
  Info
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { GENERATE_INBOX_ITEMS } from '@/lib/dummy-data';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

function InboxItemCard({ type, title, subtitle, statusText, isUnread, onClick, avatarUrl, icon: Icon, extraAction }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 p-4 ${isUnread ? 'bg-[#F4F7FC]' : 'bg-white'}`}
    >
      {/* Icon/Avatar Area */}
      <div className="pt-1 shrink-0 relative">
         {avatarUrl ? (
            <div className={`w-12 h-12 rounded-full overflow-hidden ${!isUnread && 'opacity-60 grayscale'}`}>
               <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
               {isUnread && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#F4F7FC]" />
               )}
            </div>
         ) : isUnread ? (
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
               <Icon size={22} className="text-navy" strokeWidth={2} />
            </div>
         ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
               <Icon size={22} strokeWidth={1.5} />
            </div>
         )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isUnread ? 'text-slate-500' : 'text-slate-300'}`}>
            {type}
          </span>
          <span className={`text-[11px] font-medium ${isUnread ? 'text-slate-500' : 'text-slate-300'}`}>
            {statusText}
          </span>
        </div>
        
        {/* Main Text */}
        <p className={`text-[15px] leading-[1.4] ${subtitle || extraAction ? 'mb-3' : ''} ${isUnread ? 'text-navy font-medium' : 'text-slate-400 font-normal'}`}>
          {title}
        </p>

        {/* Subtitle / Extra Action */}
        {subtitle && (
           <p className={`text-[14px] leading-[1.4] ${extraAction ? 'mb-4' : ''} ${isUnread ? 'text-slate-500' : 'text-slate-300'}`}>
              {subtitle}
           </p>
        )}

        {extraAction && (
           <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full border text-[12px] font-bold ${isUnread ? 'border-slate-200 text-navy' : 'border-slate-100 text-slate-300'}`}>
              {extraAction}
           </div>
        )}
      </div>
    </motion.button>
  );
}

function MerchantInsights({ profile, orders, items }: any) {
  // Simple aggregation for the minimalist look
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.price) || 0), 0);
  const completionRate = orders.length > 0 ? Math.round((orders.filter((o: any) => o.status === 'DELIVERED').length / orders.length) * 100) : 0;
  
  // UniKL Campus Specific Mock Aggregation
  const buildingStats = [
    { name: 'MIIT Tower', value: '42%', trend: 'up' },
    { name: 'Yayasan Building', value: '28%', trend: 'down' },
    { name: 'Student Lounge', value: '15%', trend: 'stable' },
    { name: 'Library Hub', value: '10%', trend: 'up' }
  ];

  const categoryStats = [
    { label: 'Tech Assets', color: 'bg-blue-500', share: '45%' },
    { label: 'Student Apparel', color: 'bg-emerald-500', share: '30%' },
    { label: 'Academic Books', color: 'bg-amber-500', share: '25%' }
  ];

  return (
    <div className="flex flex-col space-y-10 animate-in fade-in duration-500 pb-32">
      {/* ── INTELLIGENCE HEADER ── */}
      <section className="space-y-1">
         <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">UniKL Operational Intelligence</p>
         <h2 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">Merchant Insights Dashboard</h2>
         <p className="text-[13px] text-slate-500 font-medium tracking-tight">Live telemetry for node: {profile?.full_name}</p>
      </section>

      {/* ── HIGH-LEVEL REGISTRY NODES ── */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-1">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400">Registry nodes show aggregate liquidity and fulfillment integrity for the current cycle.</p>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-blue-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Flow</p>
               </div>
               <p className="text-[24px] font-bold text-slate-900 tracking-tight">RM {totalRevenue.toFixed(2)}</p>
               <p className="text-[11px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                  <ArrowUpRight size={12} /> +12% Cycle
               </p>
            </div>
            <div className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment</p>
               </div>
               <p className="text-[24px] font-bold text-slate-900 tracking-tight">{completionRate}%</p>
               <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase">Institutional Avg: 84%</p>
            </div>
         </div>
      </div>

      {/* ── CAMPUS HOTSPOT INTELLIGENCE ── */}
      <section className="space-y-4">
         <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2 tracking-tight">
               <MapPin size={16} className="text-slate-400" />
               Campus Demand Zones
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UniKL Registry</span>
         </div>
         <div className="flex items-center gap-2 px-1">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400 italic">Directive: Target zones with 'up' trends to maximize asset visibility during peak traffic.</p>
         </div>
         <div className="grid grid-cols-2 gap-3">
            {buildingStats.map((stat) => (
               <div key={stat.name} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30 flex flex-col justify-between h-[90px]">
                  <p className="text-[11px] font-bold text-slate-500 leading-tight">{stat.name}</p>
                  <div className="flex items-end justify-between">
                     <p className="text-[20px] font-bold text-slate-900">{stat.value}</p>
                     <div className={`w-1.5 h-1.5 rounded-full ${stat.trend === 'up' ? 'bg-emerald-500' : stat.trend === 'down' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* ── ASSET CATEGORY DISTRIBUTION ── */}
      <section className="p-6 border border-slate-100 rounded-[32px] bg-white">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Revenue per Asset Class</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
               <Info size={10} /> Data monitors liquidity per faculity node.
            </div>
         </div>
         <div className="space-y-5">
            {categoryStats.map((cat) => (
               <div key={cat.label} className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                     <span className="text-slate-400">{cat.label}</span>
                     <span className="text-slate-900">{cat.share}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                     <div className={`h-full ${cat.color} rounded-full`} style={{ width: cat.share }} />
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* ── LOGISTICS HANDSHAKE EFFICIENCY ── */}
      <section className="space-y-4">
         <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Clock size={16} className="text-slate-400" />
            Operational Handshake Metrics
         </h3>
         <div className="flex items-center gap-2 px-1">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400 italic">Instruction: Optimize prep cycles to reduce the Handshake latency below 10m.</p>
         </div>
         <div className="p-6 border border-slate-100 rounded-[32px] bg-slate-900 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="relative z-10 grid grid-cols-2 gap-8">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Prep Time</p>
                  <p className="text-[22px] font-bold">12.4m</p>
                  <div className="mt-2 h-1 w-12 bg-blue-500 rounded-full" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup Delay</p>
                  <p className="text-[22px] font-bold">4.2m</p>
                  <div className="mt-2 h-1 w-12 bg-emerald-500 rounded-full" />
               </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
               <TrendingUp size={120} strokeWidth={1} />
            </div>
         </div>
      </section>

      {/* ── TRUST & STANDING NODES ── */}
      <section className="grid grid-cols-2 gap-4">
         <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50">
            <Users size={18} className="text-slate-400 mb-3" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buyer Loyalty</p>
            <p className="text-[18px] font-bold text-slate-900 mt-1">64.2%</p>
            <p className="text-[10px] text-slate-400 mt-1">Return purchase rate</p>
         </div>
         <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50">
            <Star size={18} className="text-amber-400 mb-3" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pulse Status</p>
            <p className="text-[18px] font-bold text-slate-900 mt-1">Silver Tier</p>
            <p className="text-[10px] text-slate-400 mt-1">Top 15% in UniKL</p>
         </div>
      </section>

    </div>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => {
           const data = snap.data();
           setProfile({ ...data, uid: user.uid });
           
           // Fetch Merchant Data if applicable
           if (data?.role === 'CLUB') {
              import('firebase/firestore').then(({ query, collection, where, onSnapshot }) => {
                 onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
                    setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
                 });
                 onSnapshot(query(collection(db, "items"), where("seller_id", "==", user.uid)), (s) => {
                    setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
                    setLoading(false);
                 });
              });
           } else {
              setItems(GENERATE_INBOX_ITEMS());
              setLoading(false);
           }
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased max-w-md mx-auto border-x border-slate-50">
      
      {/* CONDITIONAL HEADER */}
      <section className="px-6 pt-12 pb-6">
         {profile?.role === 'CLUB' ? (
            <div className="flex items-center justify-between">
               <button onClick={() => router.push('/merchant')} className="p-1 -ml-2 text-slate-300 hover:text-navy transition-colors">
                  <ArrowLeft size={22} />
               </button>
               <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-400">
                  {profile?.full_name?.charAt(0)}
               </div>
            </div>
         ) : (
            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                  <button onClick={() => router.push('/home')} className="p-1 -ml-2 text-slate-300 hover:text-navy transition-colors">
                     <ArrowLeft size={22} />
                  </button>
                  <h1 className="text-[26px] font-bold tracking-tight text-navy">Inbox</h1>
               </div>
               <div className="flex-1 max-w-[120px]">
                  <div className="h-9 bg-[#F6F7F9] rounded-full flex items-center px-4 gap-2">
                     <Search size={14} className="text-slate-300" />
                     <span className="text-[11px] font-bold text-slate-300">Search</span>
                  </div>
               </div>
               <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
            </div>
         )}
      </section>

      <section className="px-6">
         {profile?.role === 'CLUB' ? (
            <MerchantInsights profile={profile} orders={orders} items={items} />
         ) : (
            <>
               {/* TABS (Pills) for Inbox */}
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
                  {['All', 'Promotions', 'News', 'Updates'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${
                        activeTab === tab 
                          ? 'bg-navy text-white shadow-md shadow-navy/10' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               {/* INBOX FEED */}
               <div className="flex flex-col">
                  {items.filter(it => activeTab === 'All' || it.type === activeTab.toUpperCase()).map((item, i) => (
                     <InboxItemCard 
                        key={item.id || i}
                        {...item}
                        onClick={() => {}}
                     />
                  ))}
               </div>
            </>
         )}
      </section>

      {/* RENDER MERCHANT BOTTOM NAV IF ROLE IS CLUB */}
      {profile?.role === 'CLUB' && (
         <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-8 pt-3 px-10 z-30 flex justify-between items-center shadow-sm max-w-md mx-auto border-x border-slate-50">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 group">
               <LayoutGrid size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">Dashboard</span>
            </button>
            <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1 group">
               <ClipboardList size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">History</span>
            </button>
            <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1 group">
               <BarChart3 size={20} className="text-blue-600" />
               <span className="text-[10px] font-bold text-blue-600">Insights</span>
            </button>
            <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1 group">
               <User size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">Account</span>
            </button>
         </nav>
      )}

    </main>
  );
}
