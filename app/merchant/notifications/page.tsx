'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Bell, Package, Info, AlertCircle, ShoppingBag, Truck } from 'lucide-react';

export default function MerchantNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const qNotifs = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        onSnapshot(qNotifs, (snap) => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await updateDoc(doc(db, "notifications", notif.id), { read: true });
    }
    // Logic for navigating based on notification type could be added here
    // e.g. router.push('/merchant/orders')
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans antialiased">
      <header className="px-8 py-6 bg-white border-b border-slate-100 sticky top-0 z-50 flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-[11px] font-medium text-slate-400">Updates and alerts for your shop</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-4">
        {notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Bell size={24} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">No notifications yet</h3>
            <p className="text-[13px] text-slate-400 mt-1 max-w-[250px]">When you receive updates about orders or your shop, they will appear here.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex gap-4 ${notif.read ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.read ? 'bg-slate-50 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                {notif.type === 'LOW_STOCK' ? <AlertCircle size={18} /> : notif.type === 'ORDER' ? <ShoppingBag size={18} /> : notif.type === 'DELIVERY' ? <Truck size={18} /> : <Info size={18} />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className={`text-[14px] truncate ${notif.read ? 'font-semibold text-slate-900' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <p className={`text-[12px] leading-relaxed mt-1 ${notif.read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>{notif.body}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
