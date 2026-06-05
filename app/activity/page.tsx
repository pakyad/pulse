'use client'

import { 
  BarChart3, TrendingUp, Users, Clock, CheckCircle2,
  Package, LayoutGrid, ClipboardList, User, ChevronRight,
  Search, ArrowLeft, MessageSquare, ArrowUpRight, MapPin,
  Star, Info, Bell, Inbox, ShoppingBag, Truck
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import BackButton from '@/components/shared/BackButton';

const DEMO_NOTIFICATIONS = [
  {
    id: 'demo_n1',
    category: 'COMMERCE',
    type: 'ORDER ALERT',
    title: 'Order #8012 Ready for Pickup',
    body: 'Your Nike Vintage Hoodie is ready. Please collect it at the SE Club booth before 5 PM.',
    time_ago: '10m ago',
    is_read: false,
    icon: ShoppingBag
  },
  {
    id: 'demo_n2',
    category: 'CAMPUS',
    type: 'RADAR MATCH',
    title: 'Potential Match for Lost Keys',
    body: "A user just posted a found item that matches your 'Honda Keys' description.",
    time_ago: '2h ago',
    is_read: false,
    icon: MapPin
  },
  {
    id: 'demo_n3',
    category: 'COMMERCE',
    type: 'LOGISTICS UPDATE',
    title: 'Runner Assigned',
    body: 'Runner Ahmad has accepted your delivery request and is heading to the pickup point.',
    time_ago: 'Yesterday',
    is_read: true,
    icon: Truck
  }
];

function InboxItemCard({ type, title, subtitle, statusText, isUnread, onClick, avatarUrl, icon: Icon, extraAction, i }: any) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      onClick={onClick}
      className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group relative ${isUnread ? 'bg-slate-50/50' : 'bg-transparent'}`}
    >
      <div className="relative shrink-0 mt-0.5">
         <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-active:scale-95 transition-transform flex items-center justify-center text-slate-400">
            {avatarUrl ? (
               <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
               Icon ? <Icon size={24} strokeWidth={1.5} className={isUnread ? "text-slate-900" : ""} /> : <Bell size={24} strokeWidth={1.5} />
            )}
         </div>
         {isUnread && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
               <div className="w-2 h-2 bg-white rounded-full" />
            </div>
         )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
         <div className="flex items-center justify-between mb-1">
            <h3 className={`text-[15px] tracking-tight truncate pr-2 ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
               {title}
            </h3>
            <span className="text-[11px] font-medium text-slate-400 shrink-0">
               {statusText}
            </span>
         </div>
         <p className="text-[14px] font-medium text-slate-500 leading-snug line-clamp-2">
            {subtitle}
         </p>
         
         <div className="flex items-center mt-2 gap-2">
           <span className="text-[10px] font-bold  text-slate-400">
             {type}
           </span>
         </div>
      </div>
    </motion.button>
  );
}

function MerchantInsights({ profile, orders }: any) {
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.price || o.total) || 0), 0);
  
  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-32">
      <section className="space-y-4">
         <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-start gap-5 shadow-xl shadow-slate-900/10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
               <TrendingUp size={24} />
            </div>
            <div className="space-y-1">
               <p className="text-[15px] font-bold tracking-tight">Weekly Performance</p>
               <p className="text-[13px] text-white/60 font-medium leading-relaxed">Your store activity is up by 14% this week. Keep items updated to maintain momentum.</p>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50 shadow-sm flex flex-col justify-between h-32">
            <p className="text-[11px] font-bold text-slate-400  mb-2">Total Earnings</p>
            <div>
               <p className="text-[22px] font-semibold text-slate-900 tracking-tight">RM {totalRevenue.toFixed(2)}</p>
               <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider mt-1">+14% Growth</p>
            </div>
         </div>
         <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50 shadow-sm flex flex-col justify-between h-32">
            <p className="text-[11px] font-bold text-slate-400  mb-2">Completion</p>
            <div>
               <p className="text-[22px] font-semibold text-slate-900 tracking-tight">98.2%</p>
               <p className="text-[11px] text-slate-900 font-bold uppercase tracking-wider mt-1">Standard</p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      // Clear existing listeners on auth change
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        // 👤 Profile Sync
        const uProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
           const data = snap.data();
           setProfile({ ...data, uid: user.uid });
           setLoading(false);
        }, (err) => {
           console.error("[Activity] Profile Sync Error:", err);
           setLoading(false);
        });
        unsubs.push(uProfile);

        // 🛍️ Operational Analytics (for Merchants/Clubs)
        if (profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' || profile?.is_verified_merchant) {
          const uOrders = onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
             setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (err) => console.error("[Activity] Orders Sync Error:", err));
          unsubs.push(uOrders);
        }

        // 🔔 Notification Relay
        const qNotif = query(
          collection(db, 'notifications'), 
          where('user_id', '==', user.uid),
          limit(50)
        );
        const uNotif = onSnapshot(qNotif, (s) => {
           const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
           docs.sort((a: any, b: any) => {
             const tA = a.created_at?.toMillis?.() || 0;
             const tB = b.created_at?.toMillis?.() || 0;
             return tB - tA;
           });
           setNotifications(docs);
        }, (err) => console.error("[Activity] Notification Sync Error:", err));
        unsubs.push(uNotif);
      } else {
        router.push('/auth');
      }
    });
    return () => {
      unsubAuth();
      unsubs.forEach(u => u());
    };
  }, [router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-slate-900 w-full max-w-2xl mx-auto">
      
      {/* ── INTERNAL NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <BackButton fallback="/home" />
            <p className="text-[14px] font-bold tracking-tight">Activity</p>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={() => router.push('/messages')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 border border-slate-50 active:scale-95 transition-all shrink-0">
                <MessageSquare size={18} />
             </button>
             <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </nav>

      <section className="px-8 pt-28 pb-4">
         {/* If Merchant, show Insights toggle here in the body */}
         {(profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' || profile?.is_verified_merchant) && (
            <div className="flex gap-2 mb-6">
               <button 
                 onClick={() => setActiveTab('All')}
                 className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all ${activeTab !== 'Insights' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
               >
                 Inbox
               </button>
               <button 
                 onClick={() => setActiveTab('Insights')}
                 className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'Insights' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
               >
                 Insights
               </button>
            </div>
         )}

        {activeTab !== 'Insights' && (
          <div className="relative group">
             <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
             <input 
                type="text" 
                placeholder="Search alerts..."
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 text-[14px] font-medium placeholder:text-[#94a3b8] outline-none focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all"
             />
          </div>
        )}
      </section>

      <section className="px-6 mt-4 space-y-4">
         {activeTab === 'Insights' && (profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' || profile?.is_verified_merchant) ? (
            <MerchantInsights profile={profile} orders={orders} />
         ) : (
            <>
               {/* ── TABS ── */}
               <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {['All', 'Commerce', 'Campus'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold tracking-tight transition-all active:scale-95 ${
                        activeTab === tab 
                          ? 'bg-slate-100 text-slate-900 border border-slate-200' 
                          : 'bg-transparent text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               {/* ── INBOX LIST ── */}
               <div className="flex flex-col -mx-2 mt-4 space-y-1">
                   {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS)
                    .filter(it => activeTab === 'All' || it.category === activeTab.toUpperCase())
                    .map((item, i) => {
                      let timeString = item.time_ago || 'Now';
                      if (!item.time_ago && item.created_at?.toMillis) {
                        const diffMins = Math.floor((Date.now() - item.created_at.toMillis()) / 60000);
                        if (diffMins < 1) timeString = 'Just now';
                        else if (diffMins < 60) timeString = `${diffMins}m ago`;
                        else if (diffMins < 1440) timeString = `${Math.floor(diffMins/60)}h ago`;
                        else timeString = `${Math.floor(diffMins/1440)}d ago`;
                      }

                      return (
                        <InboxItemCard 
                          key={item.id}
                          i={i}
                          type={item.type || 'NOTIFICATION'}
                          title={item.title}
                          subtitle={item.body || item.message}
                          statusText={timeString}
                          isUnread={!item.is_read}
                          icon={item.icon || Bell}
                          onClick={() => {
                            if (item.action_url) {
                              router.push(item.action_url);
                            } else if (item.type === 'ORDER ALERT' || item.type === 'LOGISTICS UPDATE') {
                              router.push('/me/orders/history');
                            } else if (item.category === 'CAMPUS') {
                              router.push('/hub/found');
                            } else {
                              router.push('/messages');
                            }
                          }}
                        />
                      );
                    })}
                  {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS).filter(it => activeTab === 'All' || it.category === activeTab.toUpperCase()).length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
                       <Inbox size={40} strokeWidth={1} className="text-slate-300" />
                       <p className="text-[13px] font-medium tracking-tight text-slate-400">Inbox clear</p>
                    </div>
                  )}
               </div>
            </>
         )}
      </section>

      
    </main>
  );
}
