"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Lock, MessageSquare, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'ME' | 'OTHER';
  timestamp: string;
}

interface ChatProps {
  tx_id: string;
  status: string; // PENDING, COLLECTED, DROPPED, EXPIRED
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatOverlay({ tx_id, status, recipientName, isOpen, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Handshake initiated for Order #${tx_id.slice(-5)}`, sender: 'OTHER', timestamp: '14:20' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isArchived = status === 'COLLECTED' || status === 'EXPIRED';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isArchived) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'ME',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 w-full z-60 h-[80vh] md:h-[60vh] max-w-2xl mx-auto right-0"
        >
          <div className="h-full soft-lens rounded-t-[40px] border-t border-x border-navy/10 flex flex-col overflow-hidden shadow-md">
            {/* Header */}
            <div className="p-8 border-b border-navy/5 flex justify-between items-center bg-white/40 backdrop-blur-xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center">
                     <MessageSquare className="text-navy w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy text-sm  tracking-tight">{recipientName}</h3>
                    <p className="text-[10px] text-navy/40 font-bold  tracking-widest flex items-center gap-1">
                       {isArchived ? <Lock size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                       {isArchived ? 'Session Archived' : 'Live Sync'}
                    </p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 hover:bg-navy/5 rounded-full transition-colors">
                  <X size={20} className="text-navy" />
               </button>
            </div>

            {/* Chat Canvas */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 no-scrollbar scroll-smooth">
               {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'} mb-6`}>
                    <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-[13px] font-medium leading-relaxed tracking-widest ${
                       msg.sender === 'ME' 
                       ? 'bg-navy text-white rounded-tr-none shadow-md' 
                       : 'soft-lens text-navy rounded-tl-none border-[0.5px] border-navy/10 shadow-sm'
                    }`}>
                       {msg.text}
                       <p className={`text-[8px] mt-1 text-right ${msg.sender === 'ME' ? 'text-white/40' : 'text-navy/30'}`}>
                          {msg.timestamp}
                       </p>
                    </div>
                 </div>
               ))}
               
               {isArchived && (
                 <div className="flex flex-col items-center gap-3 py-10 opacity-30">
                    <History size={24} className="text-navy" />
                    <p className="text-[10px] font-black  tracking-[0.3em] text-navy text-center">
                       Handshake complete. <br/> This conversation is archived.
                    </p>
                 </div>
               )}
            </div>

            {/* Input Bar */}
            <div className={`p-6 bg-white/40 backdrop-blur-xl border-t border-navy/5 ${isArchived ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex gap-3 bg-white/50 border border-navy/10 p-2 rounded-2xl focus-within:border-orange transition-all duration-300">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isArchived}
                    placeholder={isArchived ? "Session locked" : "Pulse message..."}
                    className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-navy placeholder:text-navy/20"
                  />
                  <button 
                    onClick={handleSend}
                    className="bg-navy text-white p-3 rounded-xl hover:bg-orange transition-colors"
                  >
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
