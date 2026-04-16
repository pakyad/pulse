"use client";

import React from 'react';
import { Trophy, Medal, Crown, ArrowUp, User, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getStatusTier } from '@/lib/utils/hustle';

const MOCK_LEADERS = [
  { id: '1', name: 'Iyad Iman', score: 1250, rank: 1 },
  { id: '2', name: 'Sarah Chen', score: 980, rank: 2 },
  { id: '3', name: 'Marcus Tan', score: 850, rank: 3 },
  { id: '4', name: 'Arief Hakimi', score: 720, rank: 4 },
  { id: '5', name: 'Nurul Huda', score: 680, rank: 5 },
  { id: '6', name: 'Jason Lee', score: 540, rank: 6 },
  { id: '7', name: 'Elena Gilbert', score: 410, rank: 7 },
  { id: '8', name: 'Siti Saleha', score: 390, rank: 8 },
];

export default function LeaderboardPage() {
  const userRank = 1; // Simulation
  const userScore = 1250;
  const userTier = getStatusTier(userScore);

  return (
    <div className="px-6 pt-24 pb-48 max-w-2xl mx-auto min-h-screen">
      <header className="text-center mb-16">
        <Link href="/" className="absolute left-6 top-24 p-2 hover:bg-navy/5 rounded-full transition-colors">
          <ArrowLeft className="text-navy w-5 h-5" />
        </Link>
        <p className="text-[10px] text-orange font-black uppercase tracking-[0.4em] mb-2 leading-none">Campus Hierarchy</p>
        <h1 className="text-5xl font-black text-navy tracking-tighter italic uppercase leading-none">The Pulse 50</h1>
      </header>

      {/* The Podium Spotlight */}
      <div className="flex items-end justify-center gap-2 mb-20 h-72">
        {/* 2nd Place */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full bg-navy/5 border border-navy/10 mb-3 flex items-center justify-center relative">
             <User size={24} className="text-navy/20" />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-navy/10 rounded-full flex items-center justify-center text-[10px] font-black text-navy italic">2</div>
          </div>
          <div className="hologram-card w-full p-4 text-center h-36 flex flex-col justify-center border-b-0 rounded-b-none bg-white/40">
             <p className="text-xs font-black text-navy truncate tracking-tight">{MOCK_LEADERS[1].name}</p>
             <p className="text-lg font-black text-navy/40 tracking-tighter">{MOCK_LEADERS[1].score}</p>
             <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mt-1">PRO</p>
          </div>
        </motion.div>

        {/* 1st Place - The Crown */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center z-10"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown size={32} className="text-orange mb-3" />
          </motion.div>
          
          <div className="w-20 h-20 rounded-full border-2 border-orange p-1.5 mb-3 shadow-[0_0_20px_rgba(255,133,27,0.2)]">
             <div className="w-full h-full rounded-full bg-navy/10 flex items-center justify-center">
                <User size={32} className="text-navy" />
             </div>
          </div>
          <div className="hologram-card w-full p-6 text-center h-52 flex flex-col justify-center scale-110 border-orange/30 shadow-2xl shadow-orange/10 bg-white">
             <p className="text-[10px] font-black text-orange tracking-[0.2em] mb-1">CHAMPION</p>
             <p className="text-sm font-black text-navy uppercase tracking-tight mb-2">{MOCK_LEADERS[0].name}</p>
             <div className="flex flex-col">
                <p className="text-3xl font-black text-orange tracking-tighter leading-none">{MOCK_LEADERS[0].score}</p>
                <p className="text-[9px] font-black text-orange/50 uppercase tracking-widest mt-1">Hustle HP</p>
             </div>
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full bg-navy/5 border border-navy/10 mb-3 flex items-center justify-center relative">
             <User size={24} className="text-navy/20" />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-navy/10 rounded-full flex items-center justify-center text-[10px] font-black text-navy italic">3</div>
          </div>
          <div className="hologram-card w-full p-4 text-center h-28 flex flex-col justify-center border-b-0 rounded-b-none bg-white/40">
             <p className="text-xs font-black text-navy truncate tracking-tight">{MOCK_LEADERS[2].name}</p>
             <p className="text-base font-black text-navy/40 tracking-tighter">{MOCK_LEADERS[2].score}</p>
             <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mt-1">STAR</p>
          </div>
        </motion.div>
      </div>

      {/* The Rest of the Hustlers */}
      <div className="space-y-3">
        {MOCK_LEADERS.slice(3).map((student) => (
          <motion.div 
            key={student.id} 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="soft-lens px-6 py-5 rounded-3xl flex items-center justify-between group hover:bg-white/80 transition-all border border-navy/5"
          >
            <div className="flex items-center gap-6">
              <span className="text-xs font-black text-navy/20 w-4 italic">#{student.rank}</span>
              <div className="w-10 h-10 rounded-2xl bg-navy/5 border border-navy/5 flex items-center justify-center">
                 <User size={18} className="text-navy/20" />
              </div>
              <div>
                <p className="text-sm font-black text-navy tracking-tight uppercase">{student.name}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest ${getStatusTier(student.score).color}`}>
                    {getStatusTier(student.score).label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-navy tabular-nums">{student.score} HP</p>
              <p className="text-[9px] text-green-500 font-bold flex items-center justify-end gap-1 uppercase tracking-tighter">
                <ArrowUp size={8} strokeWidth={3} /> +12
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sticky "Your Rank" Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-navy text-white p-6 rounded-[32px] flex items-center justify-between shadow-[0_20px_50px_rgba(0,31,63,0.3)] border border-white/5"
        >
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${userTier.borderColor} bg-white/5`}>
              <Zap size={20} className={userTier.color} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[9px] text-white/40 uppercase font-black tracking-[0.2em]">Your Standing</p>
                  <div className={`w-1.5 h-1.5 rounded-full ${userTier.color === 'text-orange' ? 'bg-orange' : 'bg-white'} animate-pulse`} />
              </div>
              <p className="text-base font-black italic tracking-tighter uppercase whitespace-nowrap">
                Rank #{userRank} — {userTier.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black tabular-nums ${userTier.color === 'text-orange' ? 'text-orange' : 'text-white'}`}>{userScore}</p>
            <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Aggregate HP</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
