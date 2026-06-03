'use client'

import { 
  BarChart3, TrendingUp, Users, Clock, CheckCircle2,
  Package, LayoutGrid, ClipboardList, User, ChevronRight,
  Search, ArrowLeft, MessageSquare, ArrowUpRight, MapPin,
  Star, Info, Bell, Inbox
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const DEMO_NOTIFICATIONS = [
  {
    id: 'demo_n1',
    category: 'COMMERCE',
    type: 'ORDER ALERT',
    title: 'Order #8012 Ready for Pickup',
    body: 'Your Nike Vintage Hoodie is ready. Please collect it at the SE Club booth before 5 PM.',
    time_ago: '10m ago',
    is_read: false,
  },
  {
    id: 'demo_n2',
    category: 'CAMPUS',
    type: 'RADAR MATCH',
    title: 'Potential Match for Lost Keys',
    body: "A user just posted a found item that matches your 'Honda Keys' description.",
    time_ago: '2h ago',
    is_read: false,
  },
  {
    id: 'demo_n3',
    category: 'COMMERCE',
    type: 'LOGISTICS UPDATE',
    title: 'Runner Assigned',
    body: 'Runner Ahmad has accepted your delivery request and is heading to the pickup point.',
    time_ago: 'Yesterday',
    is_read: true,
  }
];
/**
 * 🏛️ Pulse Activity & Insights
 * concept: skibidi (standardized typography & subtext)
 */

// ── SKIBIDI TYPOGRAPHY COMPONENTS ──
const SkibidiHeading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const SkibidiSubtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

function InboxItemCard({ type, title, subtitle, statusText, isUnread, onClick, avatarUrl, icon: Icon, extraAction }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 p-6 border-b border-slate-50 transition-all ${isUnread ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}`}
    >
      <div className="pt-1 shrink-0 relative">
         {avatarUrl ? (
            <div className={`w-11 h-11 rounded-xl overflow-hidden bg-white border border-slate-100 ${!isUnread && 'opacity-60'}`}>
               <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            </div>
         ) : (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm ${isUnread ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-50 border-transparent text-slate-300'}`}>
               {Icon ? <Icon size={20} /> : <Bell size={20} />}
            </div>
         )}
         {isUnread && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-900 rounded-full border-2 border-white" />
         )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isUnread ? 'text-slate-900' : 'text-[#94a3b8]'}`}>
            {type}
          </span>
          <span className="text-[10px] font-bold text-[#94a3b8]">
            {statusText}
          </span>
        </div>
        
        <p className={`text-[15px] tracking-tight leading-snug ${subtitle ? 'mb-1' : ''} ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
          {title}
        </p>

        {subtitle && (
           <p className="text-[12px] leading-relaxed text-[#94a3b8] font-medium">
              {subtitle}
           </p>
        )}

        {extraAction && (
           <div className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white shadow-sm">
              {extraAction}
           </div>
        )}
      </div>
    </motion.button>
  );
}

function MerchantInsights({ profile, orders, items }: any) {
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.price || o.total) || 0), 0);
  
  return (
    <div className="flex flex-col space-y-12 animate-in fade-in duration-500 pb-32">
      <section className="space-y-6">
         <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-start gap-5 shadow-md shadow-slate-900/10">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
               <TrendingUp size={22} />
            </div>
            <div className="space-y-1">
               <p className="text-[14px] font-bold tracking-tight">Weekly Performance</p>
               <p className="text-[11px] text-white/50 font-medium leading-relaxed">Your store activity is up by 14% this week. Keep items updated to maintain momentum.</p>
            </div>
         </div>

         <div className="px-1 space-y-1">
            <SkibidiHeading>Merchant Insights</SkibidiHeading>
            <SkibidiSubtext>Track your campus impact and store growth.</SkibidiSubtext>
         </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-6 border border-slate-50 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-32">
            <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">Total Earnings</p>
            <div>
               <p className="text-[20px] font-bold text-slate-900 tracking-tighter">RM {totalRevenue.toFixed(2)}</p>
               <p className="text-[10px] text-emerald-500 font-black uppercase tracking-wider mt-1">+14% Growth</p>
            </div>
         </div>
         <div className="p-6 border border-slate-50 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-32">
            <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">Completion Rate</p>
            <div>
               <p className="text-[20px] font-bold text-slate-900 tracking-tighter">98.2%</p>
               <p className="text-[10px] text-slate-900 font-black uppercase tracking-wider mt-1">Institutional Standard</p>
            </div>
         </div>
      </div>

      <section className="space-y-8 p-8 bg-slate-50/30 rounded-2xl border border-slate-50">
         <div className="px-1 space-y-1">
            <SkibidiHeading>Traffic Breakdown</SkibidiHeading>
            <SkibidiSubtext>Active buyers by faculty</SkibidiSubtext>
         </div>
         <div className="space-y-5">
            {[
               { name: 'MIIT (Information Tech)', color: 'bg-slate-900', pct: '62%' },
               { name: 'Business School', color: 'bg-emerald-500', pct: '24%' },
               { name: 'Engineering', color: 'bg-rose-500', pct: '14%' }
            ].map(f => (
               <div key={f.name} className="flex items-center gap-4">
                  <div className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                  <p className="text-[13px] font-bold text-slate-500 flex-1">{f.name}</p>
                  <p className="text-[13px] font-black text-slate-900">{f.pct}</p>
               </div>
            ))}
         </div>
      </section>
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
          orderBy('created_at', 'desc'),
          limit(20)
        );
        const uNotif = onSnapshot(qNotif, (s) => {
           setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })));
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
      
      <section className="px-8 pt-12 pb-6 border-b-[0.5px] border-slate-50">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
               <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
                  <ArrowLeft size={20} />
               </button>
               <div className="space-y-0.5">
                  <SkibidiHeading>Activity</SkibidiHeading>
                  <SkibidiSubtext>Terminal Relay</SkibidiSubtext>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => router.push('/messages')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 border border-slate-50 active:scale-95 transition-all shrink-0">
                  <MessageSquare size={18} />
               </button>
               <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
            </div>
         </div>
      </section>

      <section className="px-8 mt-10">
         {profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' || profile?.is_verified_merchant ? (
            <MerchantInsights profile={profile} orders={orders} />
         ) : (
            <>
               <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-8">
                  {['All', 'Alerts', 'Commerce', 'Campus'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 px-5 py-2.5 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                          : 'bg-slate-50 text-[#94a3b8] hover:bg-slate-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="flex flex-col -mx-8">
                  {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS)
                    .filter(it => activeTab === 'All' || it.category === tabMap[activeTab])
                    .map((item) => (
                      <InboxItemCard 
                        key={item.id}
                        type={item.type || 'NOTIFICATION'}
                        title={item.title}
                        subtitle={item.body || item.message}
                        statusText={item.time_ago || 'Now'}
                        isUnread={!item.is_read}
                        icon={Bell}
                        onClick={() => {
                          if (item.type === 'ORDER ALERT' || item.type === 'LOGISTICS UPDATE') {
                            router.push('/me/orders/history');
                          } else if (item.category === 'CAMPUS') {
                            router.push('/hub/found');
                          } else {
                            router.push('/messages');
                          }
                        }}
                      />
                    ))}
                  {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS).filter(it => activeTab === 'All' || it.category === tabMap[activeTab]).length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
                       <Inbox size={40} strokeWidth={1} className="text-slate-300" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Inbox Terminal Clear</p>
                    </div>
                  )}
               </div>
            </>
         )}
      </section>

      
    </main>
  );
}

const tabMap: any = {
  'Alerts': 'ALERT',
  'Commerce': 'COMMERCE',
  'Campus': 'CAMPUS'
};
