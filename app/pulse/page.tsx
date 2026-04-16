'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar, Layers, X, Plus, Info } from 'lucide-react';

export default function PulsePage() {
  const [filter, setFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const scheduleData = [
    { id: 1, day: '15', month: 'MAY', title: 'UniKL Hackathon Challenge 2024', time: 'Fri, 4:20 AM (2hrs)', status: 'No RSVPs yet', type: 'Events' },
    { id: 2, day: '15', month: 'MAY', title: 'Entrepreneurship 101: Workshop', time: 'Fri, 4:20 AM (2hrs)', status: 'No RSVPs yet', type: 'Sessions' },
    { id: 3, day: '15', month: 'MAY', title: 'Campus Beats Live Concert', time: 'Fri, 4:20 AM (2hrs)', status: 'No tickets sold yet', type: 'Events' },
    { id: 4, day: '16', month: 'MAY', title: 'MIIT Career Fair 2024', time: 'Sat, 9:00 AM (8hrs)', status: 'Registration Open', type: 'Events' },
  ];

  const marqueeText = [
    "OFFICIAL: UNIKL CONVOCATION DATES ANNOUNCED",
    "NEW DROP: MIIT BADMINTON CLUB EXCLUSIVE JERSEY",
    "PULSE ALERT: SYSTEM MAINTENANCE AT 2:00 AM",
    "CLUB HUSTLE: EARN DOUBLE XP THIS WEEKEND",
    "TECH TALK: AI IN CAMPUS LOGISTICS - HALL A"
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-40">
      
      {/* 1. ANIMATED BANNER (INFINITE MARQUEE) */}
      <div className="bg-white border-b border-gray-100 overflow-hidden py-4 mb-8 relative shadow-sm">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-16 items-center"
        >
          {[...marqueeText, ...marqueeText].map((text, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] italic">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="px-8">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Institutional Feed</p>
            <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">PULSE HUB</h2>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="text-blue-500 font-black text-xs uppercase tracking-widest hover:opacity-50 transition-all bg-blue-50 px-4 py-2 rounded-xl"
          >
            Manage
          </button>
        </div>

        {/* 2. FILTER CHIPS */}
        <div className="flex gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
          {['All', 'Sessions', 'Events'].map((chip) => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                filter === chip 
                ? 'bg-blue-500 border-blue-500 text-white shadow-xl shadow-blue-500/20' 
                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 shadow-sm'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* 3. SCHEDULE LIST */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {scheduleData.filter(event => filter === 'All' || event.type === filter).map((event) => (
            <motion.div 
                variants={item}
                key={event.id} 
                className="flex gap-8 items-start group cursor-pointer"
            >
              {/* Date Column */}
              <div className="flex flex-col items-center min-w-[50px] pt-1">
                <span className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">{event.day}</span>
                <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest leading-none">{event.month}</span>
              </div>
              
              {/* Info Column */}
              <div className="flex-1 border-b border-gray-100 pb-10 group-last:border-none relative">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1 h-3 rounded-full ${event.type === 'Events' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{event.type}</p>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2 leading-[1.2] tracking-tight group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h4>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-400 font-medium">{event.time}</p>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">{event.status}</p>
                </div>
                
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 4. BOTTOM SHEET DRAWER (ACTION CENTER) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[50px] z-[120] px-10 pt-6 pb-16 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]"
            >
              {/* Drag Handle */}
              <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mb-10" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-blue-50 p-4 rounded-3xl"><Info className="text-blue-500" size={24} /></div>
                <div>
                   <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Schedule Actions</h3>
                   <p className="text-sm text-gray-400 font-bold mt-1">Manage your campus interactions</p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full flex justify-between items-center p-8 bg-gray-50 rounded-[32px] hover:bg-blue-50 transition-all group active:scale-[0.98]">
                  <span className="text-lg font-black text-gray-800 tracking-tight">View Booking Calendar</span>
                  <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all"><ChevronRight size={20} /></div>
                </button>
                <button className="w-full flex justify-between items-center p-8 bg-gray-50 rounded-[32px] hover:bg-blue-50 transition-all group active:scale-[0.98]">
                  <span className="text-lg font-black text-gray-800 tracking-tight">Access Institutional Logs</span>
                  <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all"><ChevronRight size={20} /></div>
                </button>
                <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full py-5 text-sm font-black text-gray-400 uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
                >
                    Dismiss
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
