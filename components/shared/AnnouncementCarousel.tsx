"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const announcements = [
  {
    id: 1,
    title: "Official UniKL Announcement Mid-term Exam Schedule",
    category: "EDUCATION",
    date: "17 Apr 2026",
    color: "bg-slate-900",
    gradient: "from-blue-50/50 to-white",
    accent: "text-slate-900"
  },
  {
    id: 2,
    title: "Bus Tracker Maintenance: Services resume at 8:00 PM",
    category: "CAMPUS",
    date: "18 Apr 2026",
    color: "bg-orange-500",
    gradient: "from-orange-50/50 to-white",
    accent: "text-orange-600"
  },
  {
    id: 3,
    title: "Campus Library: Extended 24H Finals Week access.",
    category: "FACILITY",
    date: "20 Apr 2026",
    color: "bg-emerald-500",
    gradient: "from-emerald-50/50 to-white",
    accent: "text-emerald-600"
  },
  {
    id: 4,
    title: "New Jersey Release: Badminton Club (MIIT)",
    category: "SPORTS",
    date: "22 Apr 2026",
    color: "bg-white border-[0.5px] border-black/5",
    gradient: "from-gray-50/50 to-white",
    accent: "text-gray-600"
  }
];

const AnnouncementCarousel = () => {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-xl font-bold text-navy tracking-tight">Official Announcement</h2>
        <button className="p-2 hover:bg-slate-900/5 rounded-full transition-colors">
          <ChevronRight size={20} className="text-navy" />
        </button>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-max">
          {announcements.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-40 h-56 rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-black/5 bg-linear-to-br ${item.gradient} relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="space-y-3">
                <span className={`text-[10px] font-semibold tracking-widest ${item.accent} opacity-60 uppercase`}>
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-navy/80 leading-snug line-clamp-4">
                  {item.title}
                </h3>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-navy/30">
                  {item.date}
                </span>
                <div className={`w-8 h-8 rounded-xl ${item.color} shadow-md shadow-slate-900/10`} />
              </div>

              {/* Subtle Background Accent */}
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full ${item.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnnouncementCarousel;
