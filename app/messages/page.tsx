'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, Plus, ArrowLeft, 
  ShieldCheck, MessageSquare, Inbox, ShoppingBag, Radio
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { useRouter } from 'next/navigation';

const DEMO_CONVERSATIONS = [
  {
    id: 'demo_msg1',
    participants: [{ id: 'other1', name: 'Ahmad Faizal', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad' }],
    last_message_sender_id: 'other1',
    unread_count: 1,
    last_message_time: '2m ago',
    last_message_text: 'Is this still available? I can meet at 2PM.',
    metadata: { title: 'NIKE VINTAGE HOODIE (L)' },
    badge: 'commerce'
  },
  {
    id: 'demo_msg2',
    participants: [{ id: 'other2', name: 'Sarah Lim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }],
    last_message_sender_id: 'me',
    unread_count: 0,
    last_message_time: '1h ago',
    last_message_text: 'Yes, I handed your matric card to the library counter.',
    metadata: { title: 'LOST MATRIC CARD' },
    badge: 'radar'
  },
  {
    id: 'demo_msg3',
    participants: [{ id: 'other3', name: 'Ali Karim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali' }],
    last_message_sender_id: 'me',
    unread_count: 0,
    last_message_time: 'Yesterday',
    last_message_text: 'Thanks for the notes, appreciate it!',
    metadata: { title: 'CALCULUS TEXTBOOK' },
    badge: 'message'
  }
];

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
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-[#000000] w-full max-w-2xl mx-auto">
      
      <section className="px-6 pt-24 pb-4">
        <div className="mb-6">
           <h1 className="text-[28px] font-bold tracking-tight">Messages</h1>
           <p className="text-[13px] font-medium text-[#94a3b8] mt-1">Active sync sessions</p>
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

      <section className="px-6 mt-10 space-y-4">
         {(conversations.length > 0 ? conversations : DEMO_CONVERSATIONS).map((chat, i) => {
           const otherParticipant = chat.participants?.find((p: any) => p.id !== auth.currentUser?.uid) || chat.participants[0] || { name: 'Member', avatar: '' };
           const isUnread = chat.last_message_sender_id !== auth.currentUser?.uid && chat.unread_count > 0;
           
           return (
              <motion.button
                 key={chat.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.02 }}
                 onClick={() => router.push(`/messages/${chat.id}`)}
                 className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left group relative ${isUnread ? 'bg-slate-50/50' : 'bg-transparent'}`}
              >
                 <div className="relative shrink-0 mt-0.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-100 group-active:scale-95 transition-transform">
                       <img src={otherParticipant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant.name}`} className="w-full h-full object-cover" alt=""/>
                    </div>
                    {chat.badge === 'commerce' && (
                       <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <ShoppingBag size={11} strokeWidth={3} />
                       </div>
                    )}
                    {chat.badge === 'radar' && (
                       <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-rose-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <Radio size={11} strokeWidth={3} />
                       </div>
                    )}
                    {chat.badge === 'message' && (
                       <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <MessageSquare size={11} strokeWidth={3} />
                       </div>
                    )}
                 </div>

                 <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className={`text-[15px] tracking-tight mb-0.5 truncate ${isUnread ? 'text-[#000000] font-bold' : 'text-slate-800 font-bold'}`}>
                       {otherParticipant.name}
                    </h3>
                    
                    <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-1 truncate">
                       {chat.metadata?.title || 'GENERAL CHAT'}
                    </p>
                    
                    <p className={`text-[13px] leading-tight truncate pr-2 ${isUnread ? 'text-[#000000] font-bold' : 'text-[#94a3b8] font-medium'}`}>
                       {chat.last_message_text || 'No messages yet'}
                    </p>
                 </div>

                 <div className="shrink-0 flex flex-col items-end pt-1">
                    <span className={`text-[11px] font-black mb-3 ${isUnread ? 'text-blue-500' : 'text-[#94a3b8]'}`}>
                       {chat.last_message_time || 'Just now'}
                    </span>
                    {isUnread && (
                       <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1" />
                    )}
                 </div>
              </motion.button>
           );
         })}
         {(conversations.length > 0 ? conversations : DEMO_CONVERSATIONS).length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
              <MessageSquare size={40} strokeWidth={1} className="text-slate-300" />
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
