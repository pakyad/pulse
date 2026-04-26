'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  Plus,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { useRouter } from 'next/navigation';
import { GENERATE_MESSAGE_ITEMS } from '@/lib/dummy-data';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setConversations(GENERATE_MESSAGE_ITEMS());
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-navy max-w-md mx-auto border-x border-slate-50 shadow-sm">
      
      {/* 1. DISCOVERY HEADER */}
      <section className="px-6 pt-12 pb-4">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <button onClick={() => router.push('/home')} className="p-1 -ml-2 text-slate-300 hover:text-navy transition-colors">
                 <ArrowLeft size={22} />
              </button>
              <h1 className="text-[26px] font-bold tracking-tight text-navy">Messages</h1>
           </div>
           
           <div className="flex items-center gap-4 text-navy/40">
              <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
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

      </section>

      {/* 4. CONVERSATION LIST */}
      <section className="px-6 space-y-1">
         {conversations.map((chat, i) => (
           <motion.button
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
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
                 <div className="flex justify-between items-center mb-1">
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

                 <p className={`text-[13px] font-medium leading-tight truncate pr-4 ${chat.unread ? 'text-navy/70 font-bold' : 'text-slate-400'}`}>
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
