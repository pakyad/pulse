'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Search,
  MessageSquare,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
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

export default function InboxPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(GENERATE_INBOX_ITEMS());
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));
      }
    });
    return () => unsubAuth();
  }, []);

  const TABS = ['All', 'Promotions', 'News', 'Updates'];

  const filteredItems = items.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Promotions') return item.type === 'PROMOTIONS';
    if (activeTab === 'News') return item.type === 'NEWS';
    if (activeTab === 'Updates') return item.type === 'UPDATES' || item.type === 'ACCOUNT ACTIVITY';
    return true;
  });

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased max-w-md mx-auto border-x border-slate-50 shadow-sm">
      
      {/* HEADER */}
      <section className="px-4 pt-12 pb-3 flex items-center justify-between gap-3">
         <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 -ml-2 text-slate-300 hover:text-navy transition-colors">
               <ArrowLeft size={22} />
            </button>
            <h1 className="text-[26px] font-bold tracking-tight text-navy">Inbox</h1>
         </div>
         
         <div className="flex-1 max-w-[160px]">
            <div className="h-9 bg-[#F6F7F9] rounded-full flex items-center px-4 gap-2">
               <Search size={14} className="text-slate-300" />
               <span className="text-[11px] font-bold text-slate-300">Search...</span>
            </div>
         </div>

         <div className="flex items-center gap-3 shrink-0">
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
         </div>
      </section>

      {/* TABS (Pills) */}
      <section className="px-4 pb-3 border-b border-slate-50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                activeTab === tab 
                  ? 'bg-navy text-white shadow-md shadow-navy/10' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* FEED LIST */}
      <section className="pt-1">
         <div className="flex flex-col">
            {filteredItems.map((item, i) => (
               <InboxItemCard 
                  key={item.id || i}
                  type={item.type}
                  title={item.title}
                  subtitle={item.subtitle}
                  statusText={item.statusText}
                  isUnread={item.isUnread}
                  icon={item.icon}
                  avatarUrl={item.avatarUrl}
                  extraAction={item.extraAction}
                  onClick={() => {}}
               />
            ))}
         </div>
      </section>

      {/* FLOATING MESSAGES BUTTON */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/messages')}
        className="fixed bottom-10 right-6 w-16 h-16 bg-[#0A0F2C] text-white rounded-full flex items-center justify-center shadow-2xl shadow-navy/20 z-50 border-[3px] border-white"
      >
        <MessageSquare size={24} strokeWidth={1.5} />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#1877F2] text-white text-[11px] font-black rounded-full flex items-center justify-center border-[3px] border-white shadow-sm">
          2
        </div>
      </motion.button>

    </main>
  );
}
