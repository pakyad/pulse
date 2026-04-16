"use client";

import React, { useState } from 'react';
import { Plus, Users, CheckCircle, Clock, BarChart3, X, Zap, Shield, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
        setIsCreating(false);
        setIsModalOpen(false);
    }, 1500);
  };

  return (
    <div className="px-6 pt-24 pb-32 max-w-6xl mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-orange font-black uppercase tracking-[0.4em] px-2 py-0.5 bg-orange/10 rounded border border-orange/20">Elite Management</span>
            <div className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-navy tracking-tighter uppercase">Club Command</h1>
          <p className="text-navy/40 text-[10px] font-bold uppercase tracking-widest mt-2">Authenticated: Student Council Admin</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-navy text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-orange transition-all shadow-[0_20px_40px_rgba(0,31,63,0.15)] active:scale-95"
        >
          <Plus size={18} /> New Deployment
        </button>
      </header>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Active Pipeline', val: '12', icon: Clock, color: 'text-navy' },
          { label: 'Live Runners', val: '48', icon: Users, color: 'text-orange' },
          { label: 'Completion Rate', val: '98.2%', icon: CheckCircle, color: 'text-green-500' },
          { label: 'Hustle Volume', val: 'RM 420', icon: BarChart3, color: 'text-navy' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="hologram-card p-6 flex flex-col justify-between aspect-square border-navy/5"
          >
            <div className="flex justify-between items-start w-full">
               <stat.icon size={20} className="text-navy/20" />
               <div className="w-2 h-2 rounded-full bg-navy/5" />
            </div>
            <div>
              <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
              <p className="text-[10px] text-navy/40 uppercase font-black tracking-[0.2em] mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Mission Management Table */}
      <section className="soft-lens rounded-[40px] overflow-hidden border border-navy/10 shadow-2xl">
        <div className="bg-navy/5 px-8 py-5 border-b border-navy/10 flex justify-between items-center">
          <h3 className="text-[11px] font-black text-navy/60 uppercase tracking-[0.3em]">Live Mission Pipeline</h3>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-black text-green-600 uppercase">System Nominal</span>
          </div>
        </div>
        
        <div className="divide-y divide-navy/5 bg-white/40">
          {[
            { id: 1, title: 'Booth Setup: Engineering Week', fill: '3/5', status: 'IN_TRANSIT', time: 'Started 2h ago' },
            { id: 2, title: 'Exam Hall Logistics', fill: '0/10', status: 'AVAILABLE', time: 'Opens in 1h' },
            { id: 3, title: 'Faculty Merchandise Drop', fill: '5/5', status: 'COMPLETED', time: 'Finalized' },
          ].map((m) => (
            <div key={m.id} className="px-8 py-7 flex flex-col md:flex-row items-center justify-between hover:bg-white/60 transition-all cursor-pointer group">
              <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all group-hover:scale-110 ${
                   m.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                   m.status === 'IN_TRANSIT' ? 'bg-navy/10 border-navy/20 text-navy' :
                   'bg-navy/5 border-navy/10 text-navy/30'
                }`}>
                  {m.status === 'COMPLETED' ? <CheckCircle size={24} className="animate-pulse" /> : 
                   m.status === 'IN_TRANSIT' ? <Zap size={24} className="animate-pulse" /> : 
                   <Clock size={24} />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-navy tracking-tight">{m.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest">{m.fill} Slots Filled</p>
                    <div className="w-1 h-1 rounded-full bg-navy/10" />
                    <p className="text-[10px] font-bold text-navy/30 italic">{m.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-navy/5 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-sm font-black text-navy">4.9 ★</p>
                  <p className="text-[9px] text-navy/40 uppercase font-black tracking-widest leading-none">Rating</p>
                </div>
                <div className="w-[1px] h-8 bg-navy/10 mx-2 hidden md:block" />
                <button className="bg-navy text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-orange transition-all shadow-lg active:scale-95">
                  Manage Pipeline
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Mission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-pearl rounded-[40px] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Deploy Mission</h2>
                    <p className="text-[10px] text-navy/40 font-bold uppercase tracking-[0.2em] mt-1">Populating the Pulse Ecosystem</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-navy/5 rounded-full transition-colors">
                    <X size={24} className="text-navy" />
                </button>
              </div>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 ml-4">Mission Title</label>
                    <input type="text" placeholder="e.g. Nasi Lemak Flash Sale Delivery" className="w-full bg-navy/5 border border-navy/10 rounded-2xl py-5 px-6 font-bold text-navy focus:outline-none focus:ring-1 focus:ring-orange/30 transition-all placeholder:text-navy/20" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 ml-4">Reward Credits</label>
                        <input type="number" placeholder="RM 5.00" className="w-full bg-navy/5 border border-navy/10 rounded-2xl py-5 px-6 font-bold text-navy focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-navy/60 ml-4">Capacity (Slots)</label>
                        <input type="number" placeholder="10" className="w-full bg-navy/5 border border-navy/10 rounded-2xl py-5 px-6 font-bold text-navy focus:outline-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-navy/5 rounded-2xl p-5 border border-navy/10 flex items-center gap-4">
                        <MapPin size={20} className="text-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Pickup</p>
                            <p className="text-xs font-black text-navy uppercase tracking-tighter">Cafe A Lobby</p>
                        </div>
                    </div>
                    <div className="bg-navy/5 rounded-2xl p-5 border border-navy/10 flex items-center gap-4">
                        <Shield size={20} className="text-navy" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Security</p>
                            <p className="text-xs font-black text-navy uppercase tracking-tighter">QR Handshake</p>
                        </div>
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={isCreating}
                   className="w-full bg-navy text-white font-black py-6 rounded-[24px] uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-orange transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                 >
                   {isCreating ? 'Synchronizing Cluster...' : 'Initiate Deployment'}
                   {isCreating ? <Zap size={16} className="animate-spin" /> : <Zap size={16} />}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
