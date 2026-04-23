'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const CONVERSATIONS = [
  { 
    id: 1, 
    name: 'Iyad (Carrier)', 
    lastMsg: 'Handshake prepared. See you at Level 4.', 
    time: '2m', 
    unread: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iyad',
    type: 'LOGISTICS',
    online: true
  },
  { 
    id: 2, 
    name: 'Muhaimizu', 
    lastMsg: 'Is the Tech Hoodie still available for sync?', 
    time: '14m', 
    unread: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Muhaimizu',
    type: 'MARKET',
    online: true
  },
  { 
    id: 3, 
    name: 'Farhan (MIIT)', 
    lastMsg: 'Thanks for the quick dispatch! Verified.', 
    time: '2h', 
    unread: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Farhan',
    type: 'MARKET',
    online: false
  },
  { 
    id: 4, 
    name: 'Merchant: Tech Hub', 
    lastMsg: 'Your order is ready for pickup at our Level 3 Terminal.', 
    time: '5h', 
    unread: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Store',
    type: 'MERCHANT',
    online: true
  },
];

export default function MessagesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-navy">
      
      {/* 1. DISCOVERY HEADER */}
      <section className="px-6 pt-10 pb-4">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/activity')} className="p-1 -ml-1 text-slate-300 hover:text-navy transition-colors">
                 <ArrowLeft size={24} />
              </button>
              <h1 className="text-[24px] font-bold tracking-tight text-navy">Messages</h1>
           </div>
           
           <div className="flex items-center gap-4 text-navy/40">
              <Plus size={20} className="hover:text-navy transition-colors cursor-pointer" />
              <div className="h-8 w-8 rounded-full bg-[#0A0F1E] flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="h-full w-full object-cover" />
              </div>
           </div>
        </div>

        {/* 2. SEARCH PILL (Matured) */}
        <div className="mb-8">
           <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-navy transition-colors" />
              <input 
                 type="text" 
                 placeholder="Search conversations..."
                 className="w-full h-11 bg-slate-50 border border-slate-100/50 rounded-2xl pl-12 pr-4 text-[13px] font-medium placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 focus:ring-navy/5 transition-all"
              />
           </div>
        </div>

        {/* 3. ACTIVE CARRIERS / CONTACTS (Pulse Hub Style) */}
        <div className="mb-10">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-300">Active Syncs</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-shrink-0 relative">
                   <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-0.5 relative active:scale-95 transition-transform cursor-pointer">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Node${i}`} className="w-full h-full rounded-[0.8rem]" alt=""/>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* 4. CONVERSATION LIST */}
      <section className="px-6 space-y-1">
         {CONVERSATIONS.map((chat, i) => (
           <motion.button
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-full flex items-center gap-4 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-all text-left group relative"
           >
              {/* Avatar Context */}
              <div className="relative shrink-0">
                 <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-active:scale-90 transition-transform">
                    <img src={chat.avatar} className="w-full h-full object-cover" alt=""/>
                 </div>
                 {chat.online && (
                   <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                 )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-2">
                 <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`text-[15px] font-bold tracking-tight leading-none ${chat.unread ? 'text-navy' : 'text-navy/60'}`}>
                       {chat.name}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-300">{chat.time}</span>
                 </div>
                 
                 <div className="flex items-center gap-2 mb-1">
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${
                       chat.type === 'LOGISTICS' ? 'bg-blue-50 text-blue-500' : 
                       chat.type === 'SYSTEM' ? 'bg-indigo-50 text-indigo-500' : 
                       'bg-orange-50 text-orange-500'
                    }`}>
                       {chat.type}
                    </div>
                 </div>

                 <p className={`text-[13px] font-medium leading-tight truncate pr-4 ${chat.unread ? 'text-navy/70 text-bold font-bold' : 'text-slate-400'}`}>
                    {chat.lastMsg}
                 </p>
              </div>

              {/* Unread Action */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                 {chat.unread > 0 ? (
                   <div className="w-5 h-5 bg-navy text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg shadow-navy/20">
                      {chat.unread}
                   </div>
                 ) : (
                   <div className="text-slate-200">
                      <ChevronRight size={18} />
                   </div>
                 )}
              </div>
           </motion.button>
         ))}
      </section>

      {/* 5. SECURE SYNC BADGE */}
      <div className="flex justify-center items-center gap-2 mt-12 py-4 opacity-20">
         <ShieldCheck size={14} />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Pulse Encrypted Terminal</p>
      </div>

    </main>
  );
}
