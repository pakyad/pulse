'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Search, Image as ImageIcon, ShoppingBag, Radio, ChevronRight } from 'lucide-react';
import BackButton from '../../../components/shared/BackButton';

import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch Chat Metadata
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
           const data = chatSnap.data();
           const otherId = data.members?.find((id: string) => id !== user.uid);
           let otherName = data.participant_names?.[otherId];
           let otherAvatar = data.participant_avatars?.[otherId];

           if (!otherAvatar && otherId) {
             const userSnap = await getDoc(doc(db, 'users', otherId));
             if (userSnap.exists()) {
               otherName = userSnap.data().full_name || userSnap.data().name || userSnap.data().club_name || otherName;
               otherAvatar = userSnap.data().photo_url;
             }
           }

           setChatInfo({
              ...data,
              otherName: otherName || 'Pulse User',
              otherAvatar: otherAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${otherName || 'Pulse User'}`,
              contextTitle: data.context_title || 'Item Inquiry'
           });
           
           // Clear unread if we were the receiver
           if (data.last_message_sender_id !== user.uid && data.unread_count > 0) {
              await updateDoc(chatRef, { unread_count: 0 });
           }
        }

        // Listen for real-time messages
        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
        const unsubMessages = onSnapshot(q, (s) => {
           setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
           setLoading(false);
           setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        
        return () => unsubMessages();
      } else {
        router.push('/auth');
      }
    });
    
    return () => unsubAuth();
  }, [chatId, router]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    const user = auth.currentUser;
    if (!user) return;

    setIsSubmitting(true);
    const textToSend = newMessage.trim();
    setNewMessage(""); // Optimistic UI clear

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textToSend,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: textToSend,
        last_message_sender_id: user.uid,
        updatedAt: serverTimestamp(),
        unread_count: 1
      });
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <main className="h-screen flex flex-col bg-white font-sans antialiased text-slate-900 max-w-2xl mx-auto relative overflow-hidden">
      
      {/* ── STICKY HEADER ── */}
      <header className="shrink-0 bg-white border-b border-slate-50 px-6 pt-8 pb-4 z-50">
         <div className="flex items-center gap-4">
            <BackButton />
            
            <div className="flex-1 min-w-0 flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={chatInfo?.otherAvatar} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 min-w-0">
                  <h1 className="text-[15px] font-bold tracking-tight truncate text-slate-900">
                     {chatInfo?.otherName}
                  </h1>
               </div>
            </div>
         </div>
      </header>

      {/* ── CONTEXT BANNER (Item/Post Reference) ── */}
      <div className="shrink-0 bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${chatInfo?.type === 'MARKETPLACE' ? 'bg-blue-100 text-slate-900' : 'bg-rose-100 text-rose-600'}`}>
               {chatInfo?.type === 'MARKETPLACE' ? <ShoppingBag size={14} /> : <Radio size={14} />}
            </div>
            <div className="min-w-0 flex-1">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Discussing</p>
               <p className="text-[13px] font-bold text-slate-700 truncate">{chatInfo?.contextTitle}</p>
            </div>
         </div>
         <ChevronRight size={16} className="text-slate-300 shrink-0 ml-4" />
      </div>

      {/* ── CHAT MESSAGES ── */}
      <section className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
         {messages.map((msg, i) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            
            return (
               <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
               >
                  <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed ${
                     isMe 
                        ? 'bg-[#2A5C50] text-white rounded-br-[8px] shadow-sm shadow-[#2A5C50]/20' 
                        : 'bg-slate-50 border border-slate-100 text-slate-900 rounded-bl-[8px]'
                  }`}>
                     {msg.text}
                  </div>
               </motion.div>
            );
         })}
         <div ref={bottomRef} className="h-2" />
      </section>

      {/* ── INPUT BAR ── */}
      <div className="shrink-0 bg-white border-t border-slate-50 p-4 pb-8">
         <form onSubmit={handleSend} className="flex items-center gap-3">
            <button type="button" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 transition-transform shrink-0">
               <ImageIcon size={20} />
            </button>
            <input 
               type="text" 
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="Type a message..."
               className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-full px-6 text-[14px] font-medium outline-none placeholder:text-[#94a3b8] focus:bg-white focus:ring-4 focus:ring-slate-100/50 transition-all shadow-inner shadow-slate-100/50"
            />
            <button 
               type="submit" 
               disabled={!newMessage.trim() || isSubmitting}
               className="w-12 h-12 shrink-0 rounded-2xl bg-[#2A5C50] border-2 border-black/5 flex items-center justify-center text-white shadow-[0_3px_0_0_#193831] active:shadow-[0_0px_0_0_#193831] active:translate-y-[3px] transition-all disabled:opacity-40 disabled:pointer-events-none group"
            >
               <Send size={18} className="mr-0.5 drop-shadow-[1px_1px_0_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
            </button>
         </form>
      </div>

    </main>
  );
}
