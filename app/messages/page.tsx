'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, Plus, ArrowLeft, 
  ShieldCheck, MessageSquare, Inbox
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));
        
        // 💬 Real Conversations Only
        const q = query(
          collection(db, 'conversations'),
          where('participant_ids', 'array-contains', user.uid),
          orderBy('last_message_at', 'desc'),
          limit(30)
        );
        
        onSnapshot(q, (s) => {
          setConversations(s.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsubAuth();
  }, [router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-[#000000] max-w-md mx-auto border-x border-slate-50">
      
      <section className="px-8 pt-12 pb-4">
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-90 transition-all">
                 <ArrowLeft size={20} />
              </button>
              <h1 className="text-[24px] font-bold tracking-tight">Messages</h1>
           </div>
           <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
        </div>

        <div className="relative group">
           <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#000000] transition-colors" />
           <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 text-[14px] font-medium placeholder:text-[#94a3b8] outline-none focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all"
           />
        </div>
      </section>

      <section className="px-8 mt-10 space-y-1">
         {conversations.length > 0 ? conversations.map((chat, i) => {
           const otherParticipant = chat.participants?.find((p: any) => p.id !== auth.currentUser?.uid) || { name: 'Member', avatar: '' };
           const isUnread = chat.last_message_sender_id !== auth.currentUser?.uid && chat.unread_count > 0;
           
           return (
              <motion.button
                 key={chat.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.02 }}
                 onClick={() => router.push(`/messages/${chat.id}`)}
                 className={`w-full flex items-center gap-5 py-5 border-b border-slate-50 transition-all text-left group relative ${isUnread ? 'bg-slate-50/50 -mx-8 px-8' : ''}`}
              >
                 <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-active:scale-90 transition-transform">
                       <img src={otherParticipant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant.name}`} className="w-full h-full object-cover" alt=""/>
                    </div>
                    {chat.is_online && (
                       <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                       <h3 className={`text-[15px] font-bold tracking-tight ${isUnread ? 'text-[#000000]' : 'text-slate-600'}`}>
                          {otherParticipant.name}
                       </h3>
                       <span className="text-[11px] font-medium text-[#94a3b8]">{chat.last_message_time || 'Just now'}</span>
                    </div>
                    
                    <p className={`text-[13px] font-medium leading-tight truncate pr-8 ${isUnread ? 'text-[#000000] font-bold' : 'text-[#94a3b8]'}`}>
                       {chat.last_message_text || 'No messages yet'}
                    </p>
                 </div>

                 <div className="shrink-0">
                    {isUnread ? (
                       <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20" />
                    ) : (
                       <ChevronRight size={18} className="text-slate-200" />
                    )}
                 </div>
              </motion.button>
           );
         }) : (
           <div className="py-32 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
              <MessageSquare size={40} strokeWidth={1} className="opacity-20" />
              <p className="text-[12px] font-bold uppercase tracking-widest">No conversations yet</p>
           </div>
         )}
      </section>

      <div className="flex justify-center items-center gap-2 mt-16 py-4 opacity-20">
         <ShieldCheck size={14} />
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Pulse Verified Protocol</p>
      </div>

    </main>
  );
}
