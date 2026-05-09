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

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[24px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[14px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

function InboxItemCard({ type, title, subtitle, statusText, isUnread, onClick, avatarUrl, icon: Icon, extraAction }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 p-5 border-b border-slate-50 transition-all ${isUnread ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}`}
    >
      <div className="pt-1 shrink-0 relative">
         {avatarUrl ? (
            <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-100 ${!isUnread && 'opacity-60'}`}>
               <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            </div>
         ) : (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isUnread ? 'bg-white border-slate-200 text-[#1e293b]' : 'bg-slate-50 border-transparent text-slate-300'}`}>
               {Icon ? <Icon size={22} /> : <Bell size={22} />}
            </div>
         )}
         {isUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
         )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnread ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>
            {type}
          </span>
          <span className="text-[11px] font-medium text-[#94a3b8]">
            {statusText}
          </span>
        </div>
        
        <p className={`text-[15px] leading-snug ${subtitle ? 'mb-1' : ''} ${isUnread ? 'text-[#1e293b] font-bold' : 'text-slate-500 font-medium'}`}>
          {title}
        </p>

        {subtitle && (
           <p className="text-[13px] leading-snug text-[#94a3b8] font-medium">
              {subtitle}
           </p>
        )}

        {extraAction && (
           <div className="mt-3 inline-flex items-center justify-center px-4 py-1.5 rounded-xl border border-slate-100 text-[11px] font-bold text-[#1e293b] bg-white shadow-sm">
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
         <div className="p-6 bg-[#1e293b] rounded-[32px] text-white flex items-start gap-5 shadow-xl shadow-slate-900/10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
               <TrendingUp size={24} />
            </div>
            <div className="space-y-1">
               <p className="text-[15px] font-bold tracking-tight">Weekly Performance</p>
               <p className="text-[12px] text-white/50 font-medium leading-relaxed">Your store activity is up by 14% this week. Keep items updated to maintain momentum.</p>
            </div>
         </div>

         <div className="px-1">
            <h2 className="text-[24px] font-bold text-[#1e293b] tracking-tight">Merchant Insights</h2>
            <p className="text-[14px] font-medium text-[#94a3b8]">Track your campus impact and store growth.</p>
         </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-6 border border-slate-100 rounded-[32px] bg-white shadow-sm flex flex-col justify-between h-36">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Total Earnings</p>
            <div>
               <p className="text-[22px] font-bold text-[#1e293b]">RM {totalRevenue.toFixed(2)}</p>
               <p className="text-[10px] text-emerald-500 font-bold mt-1">+14% growth</p>
            </div>
         </div>
         <div className="p-6 border border-slate-100 rounded-[32px] bg-white shadow-sm flex flex-col justify-between h-36">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Completion Rate</p>
            <div>
               <p className="text-[22px] font-bold text-[#1e293b]">98.2%</p>
               <p className="text-[10px] text-blue-500 font-bold mt-1">Excellent standing</p>
            </div>
         </div>
      </div>

      <section className="space-y-6 p-8 bg-slate-50/50 rounded-[40px] border border-slate-100">
         <div className="px-1">
            <h3 className="text-[16px] font-bold text-[#1e293b]">Traffic Breakdown</h3>
            <p className="text-[12px] font-medium text-[#94a3b8]">Active buyers by faculty</p>
         </div>
         <div className="space-y-4">
            {[
               { name: 'MIIT (Information Tech)', color: 'bg-blue-500', pct: '62%' },
               { name: 'Business School', color: 'bg-emerald-500', pct: '24%' },
               { name: 'Engineering', color: 'bg-rose-500', pct: '14%' }
            ].map(f => (
               <div key={f.name} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${f.color}`} />
                  <p className="text-[13px] font-bold text-slate-700 flex-1">{f.name}</p>
                  <p className="text-[13px] font-black text-[#1e293b]">{f.pct}</p>
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
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => {
           const data = snap.data();
           setProfile({ ...data, uid: user.uid });
           
           if (data?.role === 'CLUB' || data?.role === 'OFFICIAL') {
              onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
                 setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
              });
              setLoading(false);
           } else {
              // 🔔 Real Notifications Only
              const qNotif = query(
                collection(db, 'notifications'), 
                where('user_id', '==', user.uid),
                orderBy('created_at', 'desc'),
                limit(20)
              );
              onSnapshot(qNotif, (s) => {
                 setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() })));
                 setLoading(false);
              }, (err) => {
                 console.error(err);
                 setLoading(false);
              });
           }
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-[#1e293b]">
      
      <section className="px-8 pt-12 pb-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all">
                  <ArrowLeft size={20} />
               </button>
               <Heading>{profile?.role === 'CLUB' ? 'Insights' : 'Inbox'}</Heading>
            </div>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </section>

      <section className="px-8 mt-6">
         {profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' ? (
            <MerchantInsights profile={profile} orders={orders} />
         ) : (
            <>
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-8">
                  {['All', 'Alerts', 'Commerce', 'Campus'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 px-5 py-2.5 rounded-[18px] text-[12px] font-bold transition-all ${
                        activeTab === tab 
                          ? 'bg-[#1e293b] text-white shadow-lg shadow-slate-900/10' 
                          : 'bg-slate-50 text-[#94a3b8] hover:bg-slate-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="flex flex-col -mx-8">
                  {notifications.length > 0 ? (
                    notifications.filter(it => activeTab === 'All' || it.category === tabMap[activeTab]).map((item) => (
                      <InboxItemCard 
                        key={item.id}
                        type={item.type || 'NOTIFICATION'}
                        title={item.title}
                        subtitle={item.body || item.message}
                        statusText={item.time_ago || 'Now'}
                        isUnread={!item.is_read}
                        onClick={() => {}}
                      />
                    ))
                  ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
                       <Inbox size={40} strokeWidth={1} className="opacity-20" />
                       <p className="text-[12px] font-bold uppercase tracking-widest">Your inbox is clear</p>
                    </div>
                  )}
               </div>
            </>
         )}
      </section>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}

const tabMap: any = {
  'Alerts': 'ALERT',
  'Commerce': 'COMMERCE',
  'Campus': 'CAMPUS'
};
