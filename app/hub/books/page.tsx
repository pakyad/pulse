'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, 
  Search, 
  Library, 
  ChevronLeft, 
  ArrowRight, 
  BookOpen, 
  QrCode,
  Globe,
  Clock,
  Sparkles
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useRouter } from 'next/navigation';

const RECENT_BOOKS = [
  { id: 1, title: "Advanced Neural Networks", author: "Dr. Elena V.", status: "AVAILABLE", type: "LIBRARY" },
  { id: 2, title: "Systems Architecture 101", author: "Prof. Marcus", status: "DUE: 24 APR", type: "BORROWED" },
  { id: 3, title: "React & Beyond v16", author: "Vercel Lab", status: "AVAILABLE", type: "EXCHANGE" },
];

export default function BooksHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-navy">
      {/* 1. KNOWLEDGE HEADER */}
      <section className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <BackButton />
        <div className="text-center">
          <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-[0.4em] mb-1">Knowledge Sync</p>
          <h1 className="text-[20px] font-bold tracking-widest text-navy">Campus Library Hub</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-500">
          <Book size={20} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 space-y-12 mt-8">
        
        {/* 2. SEARCH INTERFACE */}
        <div className="relative group">
           <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-navy transition-colors">
              <Search size={20} />
           </div>
           <input 
              type="text" 
              placeholder="Search library or textbook exchange..."
              className="w-full h-16 bg-slate-50 border border-slate-100 rounded-4xl pl-16 pr-6 text-[14px] font-medium outline-none focus:bg-white focus:border-violet-500 focus:shadow-md focus:shadow-violet-500/10 transition-all"
           />
        </div>

        {/* 3. QUICK ACCESS GRID */}
        <section className="grid grid-cols-2 gap-4">
           <button className="p-8 bg-violet-600 rounded-[3rem] text-white space-y-4 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                 <QrCode size={48} />
              </div>
              <p className="text-[10px] font-semibold tracking-widest uppercase opacity-60">Digital Pass</p>
              <h3 className="text-[18px] font-bold leading-tight">Instant Library <br />Checkout</h3>
           </button>
           
           <button className="p-8 bg-slate-50 border border-slate-100 rounded-[3rem] text-navy space-y-4 text-left group hover:bg-white transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-violet-500 shadow-sm">
                 <Globe size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-300">Repository</p>
                 <h3 className="text-[18px] font-bold leading-tight">Research <br />Database</h3>
              </div>
           </button>
        </section>

        {/* 4. RECENT ACTIVITY */}
        <section className="space-y-6">
           <div className="flex justify-between items-end">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Active Syncs</h3>
              <button className="text-[11px] font-bold text-violet-500 ">History</button>
           </div>
           
           <div className="space-y-4">
              {RECENT_BOOKS.map((book) => (
                <div key={book.id} className="p-6 bg-white border border-slate-50 rounded-[2.5rem] flex items-center gap-6 group cursor-pointer hover:shadow-md hover:shadow-navy/5 transition-all">
                   <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                      <BookOpen size={22} strokeWidth={1.5} />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[16px] font-bold text-navy tracking-tight">{book.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-[11px] font-medium text-slate-400">{book.author}</p>
                         <span className="w-1 h-1 rounded-full bg-slate-200" />
                         <p className="text-[9px] font-semibold text-violet-500 ">{book.type}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`text-[9px] font-semibold px-3 py-1 rounded-full border border-slate-100 ${book.status.includes('DUE') ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                         {book.status}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* 5. TEXTBOOK EXCHANGE PROMO */}
        <section className="bg-navy text-white p-10 rounded-[4rem] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[100px] rounded-full" />
           <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                 <Sparkles size={20} className="text-violet-400" />
                 <p className="text-[11px] font-semibold tracking-widest uppercase text-white/40">Market Integration</p>
              </div>
              <h2 className="text-[28px] font-bold tracking-widest leading-none">Recycle Your Knowledge.</h2>
              <p className="text-[14px] text-white/40 leading-relaxed font-medium">
                 List your used textbooks on the Pulse Marketplace and earn instant university credits.
              </p>
              <button className="w-fit px-8 py-4 bg-white text-navy rounded-full text-[11px] font-semibold hover:bg-violet-500 hover:text-white transition-all">
                 List Textbook
              </button>
           </div>
        </section>

      </div>
    </main>
  );
}
