"use client";

import React, { useState } from 'react';
import { Zap, Package, MapPin, Shield, Building, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_MISSIONS = [
  { id: 'm1', title: 'Cafe → Library Delivery', type: 'RUNNER', start: 'CAFE A', end: 'LIBRARY L3', reward: 3.50, hp: 15 },
  { id: 'm2', title: 'Club Event Equipment', type: 'CLUB', start: 'STUDENT UNION', end: 'BK12', reward: 10.00, hp: 40 },
  { id: 'm3', title: 'Official Exam Papers', type: 'OFFICIAL', start: 'REGISTRY', end: 'EXAM HALL', reward: 15.00, hp: 60 },
  { id: 'm4', title: 'Printouts [Mechanical]', type: 'RUNNER', start: 'BK12 PRINT', end: 'N24 STUDIO', reward: 2.00, hp: 10 },
];

export default function MissionBoard() {
  const [filter, setFilter] = useState('ALL');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const filteredMissions = MOCK_MISSIONS.filter(m => filter === 'ALL' || m.type === filter);

  const handleClaim = (id: string) => {
    setIsClaiming(id);
    // Simulation of API call to /api/missions/claim
    setTimeout(() => {
        setIsClaiming(null);
        alert(`Mission Secured! Hustle capacity checked.`);
    }, 800);
  };

  return (
    <div className="px-6 pt-12 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-navy uppercase tracking-tighter">Mission Board</h1>
        <p className="text-sm text-navy/40 font-bold uppercase tracking-widest mt-1 italic">
          Active Pulse: {MOCK_MISSIONS.length} Available Hustles
        </p>
      </header>

      {/* Tactical Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {['ALL', 'RUNNER', 'CLUB', 'OFFICIAL'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all whitespace-nowrap border ${
                filter === tab 
                ? 'bg-navy text-white border-navy shadow-xl scale-105' 
                : 'soft-lens text-navy/40 border-navy/5 hover:border-navy/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mission List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredMissions.map((mission) => (
            <motion.div 
              key={mission.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="hologram-card p-6 relative overflow-hidden group border-navy/5"
            >
              {/* Reward Tag: Luminous Orange */}
              <div className="absolute top-0 right-0 p-4">
                 <span className="bg-orange text-white text-[10px] px-3 py-1.5 rounded-lg font-black shadow-[0_0_15px_rgba(255,133,27,0.3)]">
                    +{mission.hp} HP
                 </span>
              </div>
              
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl flex items-center justify-center border transition-colors ${
                    mission.type === 'OFFICIAL' ? 'bg-navy/5 text-navy border-navy/10' :
                    mission.type === 'CLUB' ? 'bg-orange/5 text-orange border-orange/10' :
                    'bg-navy/5 text-navy/40 border-navy/5'
                }`}>
                  {mission.type === 'OFFICIAL' ? <Shield size={24} /> : 
                   mission.type === 'CLUB' ? <Building size={24} /> : 
                   <Package size={24} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-navy/30">{mission.type} MISSION</span>
                    <div className="w-1 h-1 rounded-full bg-navy/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange">RM {mission.reward.toFixed(2)}</span>
                  </div>
                  
                  <h3 className="text-lg font-black text-navy uppercase tracking-tighter leading-tight mb-2">
                    {mission.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[10px] text-navy/60 font-mono italic mb-6">
                    <MapPin size={10} className="text-orange" /> 
                    <span>{mission.start}</span>
                    <ArrowRight size={10} className="opacity-30" />
                    <span className="text-navy">{mission.end}</span>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleClaim(mission.id)}
                      disabled={isClaiming !== null}
                      className="bg-navy text-white text-[10px] px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-orange transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isClaiming === mission.id ? 'Securing...' : 'Accept Hustle'}
                      <Zap size={12} className={isClaiming === mission.id ? 'animate-spin' : ''} />
                    </button>
                    <button className="soft-lens text-navy text-[10px] px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] border border-navy/10 hover:bg-white transition-all">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
