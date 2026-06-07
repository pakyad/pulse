'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, Plus, ArrowLeft, 
  ShieldCheck, MessageSquare, Inbox, ShoppingBag, Radio
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import BackButton from '@/components/shared/BackButton';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const DEMO_CONVERSATIONS = [
  {
    id: 'demo_msg1',
    participants: [{ id: 'other1', name: 'Ahmad Faizal', avatar: '' }],
    last_message_sender_id: 'other1',
    unread_count: 1,
    last_message_time: '2m ago',
    last_message_text: 'Is this still available? I can meet at 2PM.',
    metadata: { title: 'NIKE VINTAGE HOODIE (L)' },
    type: 'MARKETPLACE'
  },
  {
    id: 'demo_msg2',
    participants: [{ id: 'other2', name: 'Sarah Lim', avatar: '' }],
    last_message_sender_id: 'me',
    unread_count: 0,
    last_message_time: '1h ago',
    last_message_text: 'Yes, I handed your matric card to the library counter.',
    metadata: { title: 'LOST MATRIC CARD' },
    type: 'RADAR'
  },
  {
    id: 'demo_msg3',
    participants: [{ id: 'other3', name: 'Ali Karim', avatar: '' }],
    last_message_sender_id: 'me',
    unread_count: 0,
    last_message_time: 'Yesterday',
    last_message_text: 'Thanks for the notes, appreciate it!',
    metadata: { title: 'CALCULUS TEXTBOOK' },
    type: 'MESSAGE'
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
        
        //  Real Chats Only
        const q = query(
          collection(db, 'chats'),
          where('members', 'array-contains', user.uid)
        );
        
        onSnapshot(q, async (s) => {
          const rawChats = s.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Fetch profiles dynamically for the OTHER participant
          const enrichedChats = await Promise.all(rawChats.map(async (chat: any) => {
             const otherId = chat.members?.find((m: string) => m !== user.uid);
             let realName = chat.participant_names?.[otherId] || 'Pulse Student';
             let realAvatar = '';
             
             if (otherId) {
                // We ALWAYS fetch live profile data to ensure avatars exist
                try {
                   const { getDoc, doc } = await import('firebase/firestore');
                   const uSnap = await getDoc(doc(db, 'users', otherId));
                   if (uSnap.exists()) {
                      const uData = uSnap.data();
                      realName = uData.full_name || uData.name || uData.club_name || realName;
                      realAvatar = uData.photo_url || '';
                   }
                } catch (e) {
                   console.error("Profile fetch error", e);
                }
             }
             
             return {
                ...chat,
                otherParticipant: {
                   id: otherId,
                   name: realName,
                   avatar: realAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${realName}`
                }
             };
          }));
          
          // Sort locally by updatedAt to avoid Firebase composite index errors
          enrichedChats.sort((a, b) => {
             const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
             const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
             return timeB - timeA;
          });
          
          setConversations(enrichedChats);
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
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-slate-900 w-full max-w-2xl mx-auto">
      {/*  INTERNAL NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <BackButton fallback="/activity" />
         <p className="text-[14px] font-bold tracking-tight">Messages</p>
      </nav>

      <section className="px-6 pt-28">
        <div className="relative group">
           <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
           <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 text-[14px] font-medium placeholder:text-[#94a3b8] outline-none focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all"
           />
        </div>
      </section>

      <section className="px-6 mt-10 space-y-4">
         {conversations.map((chat, i) => {
           const otherParticipant = chat.otherParticipant || { name: 'Pulse User', avatar: '' };
           const isUnread = chat.last_message_sender_id !== auth.currentUser?.uid && chat.unread_count > 0;
           
           return (
              <motion.button
                 key={chat.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.02 }}
                 onClick={() => router.push(`/messages/${chat.id}`)}
                 className={`w-full flex items-start gap-3 p-3 rounded-2xl transition-all text-left group relative ${isUnread ? 'bg-slate-50/50' : 'bg-transparent'}`}
              >
                 <div className="relative shrink-0 mt-0.5">
                    <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-white border border-slate-100 group-active:scale-95 transition-transform">
                       <img src={otherParticipant.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherParticipant.name}`} className="w-full h-full object-cover" alt=""/>
                    </div>
                    {chat.type === 'MARKETPLACE' && (
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <ShoppingBag size={10} strokeWidth={3} />
                       </div>
                    )}
                    {chat.type === 'RADAR' && (
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <Radio size={10} strokeWidth={3} />
                       </div>
                    )}
                    {chat.type === 'MESSAGE' && (
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white">
                          <MessageSquare size={10} strokeWidth={3} />
                       </div>
                    )}
                 </div>

                 <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className={`text-[15px] tracking-tight mb-0.5 truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-800 font-bold'}`}>
                       {otherParticipant.name}
                    </h3>
                    
                    <p className="text-[10px] font-semibold text-[#94a3b8]  mb-1 truncate">
                       {chat.context_title || chat.metadata?.title || 'GENERAL CHAT'}
                    </p>
                    
                    <p className={`text-[13px] leading-tight truncate pr-2 ${isUnread ? 'text-slate-900 font-bold' : 'text-[#94a3b8] font-medium'}`}>
                       {chat.lastMessage || chat.last_message_text || 'No messages yet'}
                    </p>
                 </div>

                 <div className="shrink-0 flex flex-col items-end pt-1">
                    <span className={`text-[11px] font-semibold mb-3 ${isUnread ? 'text-slate-900' : 'text-[#94a3b8]'}`}>
                       {chat.last_message_time || 'Just now'}
                    </span>
                    {isUnread && (
                       <div className="w-2.5 h-2.5 bg-slate-900 rounded-full mr-1" />
                    )}
                 </div>
              </motion.button>
           );
         })}
         {conversations.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center text-[#94a3b8] gap-4">
              <MessageSquare size={40} strokeWidth={1} className="text-slate-300" />
              <p className="text-[12px] font-bold ">No conversations yet</p>
           </div>
         )}
      </section>

    </main>
  );
}
