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
      <section className="space-y-4">
         {/* Smart Alert Node */}
         <div className="p-4 bg-blue-600 rounded-[28px] text-white flex items-start gap-4 shadow-lg shadow-blue-600/20">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
               <TrendingUp size={20} />
            </div>
            <div className="space-y-1">
               <p className="text-[13px] font-bold">Event Alert: Sports Week</p>
               <p className="text-[11px] text-blue-100 leading-tight">High demand expected from the Sports Complex zone. Increase stock for drinks and jerseys.</p>
            </div>
         </div>

         <div className="space-y-1">
            <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Insights</h2>
            <p className="text-[14px] text-slate-400">Deep-dive into your shop's campus performance.</p>
         </div>
      </section>

      {/* ── HIGH-LEVEL REGISTRY NODES ── */}
      <div className="grid grid-cols-2 gap-4">
         <div className="p-6 border border-slate-100 rounded-[32px] bg-white shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Earnings</p>
            <p className="text-[22px] font-bold text-slate-900">RM {totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">+14% vs last week</p>
         </div>
         <div className="p-6 border border-slate-100 rounded-[32px] bg-white shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prep Speed</p>
            <p className="text-[22px] font-bold text-slate-900">8.4 min</p>
            <p className="text-[10px] text-blue-500 font-bold mt-1">Faster than avg.</p>
         </div>
      </div>

      {/* ── CAMPUS HOTSPOT INTELLIGENCE ── */}
      <section className="space-y-6">
         <div className="space-y-1">
            <h3 className="text-[16px] font-bold text-slate-900">The Campus Pulse</h3>
            <p className="text-[12px] text-slate-400">Hourly order traffic across UniKL.</p>
         </div>
         <div className="h-[120px] flex items-end justify-between gap-1 px-2">
            {[30, 45, 60, 90, 100, 70, 40, 20, 15, 10].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-full rounded-t-lg transition-all duration-700 ${i === 4 ? 'bg-blue-600' : 'bg-slate-100'}`} style={{ height: `${h}%` }} />
                  <span className="text-[8px] font-bold text-slate-300">{8 + i}h</span>
               </div>
            ))}
         </div>
         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 text-center">Peak rush detected between <span className="font-bold text-slate-900">12:00 PM - 2:00 PM</span>.</p>
         </div>
      </section>

      <section className="space-y-4">
         <h3 className="text-[16px] font-bold text-slate-900">Faculty Reach</h3>
         <div className="space-y-3">
            {[
               { name: 'MIIT (Tech)', color: 'bg-blue-500', pct: '62%' },
               { name: 'Business School', color: 'bg-emerald-500', pct: '24%' },
               { name: 'Engineering', color: 'bg-rose-500', pct: '14%' }
            ].map(f => (
               <div key={f.name} className="flex items-center gap-4 p-4 border border-slate-50 rounded-[24px]">
                  <div className={`w-2 h-2 rounded-full ${f.color}`} />
                  <p className="text-[13px] font-bold text-slate-700 flex-1">{f.name}</p>
                  <p className="text-[13px] font-black text-slate-900">{f.pct}</p>
               </div>
            ))}
         </div>
      </section>

      {/* ── ASSET CATEGORY DISTRIBUTION ── */}
      <section className="p-8 border border-slate-100 rounded-[36px] bg-white">
         <h3 className="text-[16px] font-bold text-slate-900 mb-6">Sales by Category</h3>
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
         <h3 className="text-[16px] font-bold text-slate-900">Average Times</h3>
         <div className="p-8 bg-slate-900 text-white rounded-[40px] grid grid-cols-2 gap-8 shadow-xl shadow-slate-900/10">
            <div>
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Preparation</p>
               <p className="text-[24px] font-bold">12.4m</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Pickup</p>
               <p className="text-[24px] font-bold">4.2m</p>
            </div>
         </div>
      </section>

      {/* ── TRUST & STANDING NODES ── */}
      <section className="grid grid-cols-2 gap-4">
         <div className="p-6 border border-slate-50 rounded-[32px] bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Returning Buyers</p>
            <p className="text-[20px] font-bold text-slate-900">64.2%</p>
         </div>
         <div className="p-6 border border-slate-50 rounded-[32px] bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shop Tier</p>
            <p className="text-[20px] font-bold text-slate-900">Silver</p>
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
               <AvatarDropdown 
                  photoUrl={profile?.photo_url} 
                  userName={profile?.full_name || 'Merchant'} 
               />
            </div>
         ) : (
            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                  <button onClick={() => router.push('/home')} className="p-1 -ml-2 text-slate-300 hover:text-navy transition-colors">
                     <ArrowLeft size={22} />
                  </button>
                  <h1 className="text-[22px] font-black tracking-tight text-navy">Inbox</h1>
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
         <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-slate-100 pb-8 pt-4 px-10 z-50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.02)] max-w-md mx-auto">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1.5 transition-all active:scale-90">
               <LayoutGrid size={22} className="text-slate-300" strokeWidth={2} />
               <span className="text-[12px] font-bold text-slate-400">Dashboard</span>
            </button>
            <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1.5 transition-all active:scale-90">
               <ClipboardList size={22} className="text-slate-300" strokeWidth={2} />
               <span className="text-[12px] font-bold text-slate-400">History</span>
            </button>
            <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1.5 transition-all active:scale-90">
               <BarChart3 size={22} className="text-blue-600" strokeWidth={2.5} />
               <span className="text-[12px] font-bold text-blue-600">Insights</span>
            </button>
            <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1.5 transition-all active:scale-90">
               <User size={22} className="text-slate-300" strokeWidth={2} />
               <span className="text-[12px] font-bold text-slate-400">Account</span>
            </button>
         </nav>
      )}

    </main>
  );
}
