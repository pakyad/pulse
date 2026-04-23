"use client";

import React, { useEffect } from 'react';
import HologramID from '@/components/shared/HologramID';
import HypeGrid from '@/components/marketplace/HypeGrid';
import AnnouncementCarousel from '@/components/shared/AnnouncementCarousel';
import ServiceGrid from '@/components/shared/ServiceGrid';
import LatestHero from '@/components/shared/LatestHero';
import { db, auth } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        window.location.href = '/home';
      } else {
        window.location.href = '/auth';
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="pt-24 min-h-screen">
      <main className="pb-20 px-6 max-w-7xl mx-auto space-y-16">
        {/* Campus Hub Section */}
        <ServiceGrid />

        {/* Latest Hero Slider */}
        <LatestHero />

        {/* Official Announcement Section */}
        <AnnouncementCarousel />

        {/* Digital ID Section */}
        <section className="flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-navy tracking-tight">Your Digital Campus</h2>
            <p className="text-navy/40 text-sm max-w-md mx-auto">Tap your pulse card to verify identity or generate transaction handshakes.</p>
          </div>
          <HologramID 
            name="Iyad Iman" 
            role="ELITE RUNNER" 
            matricNo="BI20110342" 
            qrValue="TX_HANDSHAKE_PULSE_2026_IYAD"
          />
        </section>

        {/* Marketplace Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-xl font-bold text-navy tracking-tight">Activity Hub</h2>
            <button className="text-xs font-bold text-navy/40 hover:text-navy transition-colors  tracking-widest">View All</button>
          </div>
          <HypeGrid />
        </section>
      </main>

      {/* Floating Bottom Nav for Mobile UX */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="soft-lens rounded-full px-8 py-4 flex gap-12 items-center shadow-2xl border-[0.5px] border-white/50">
          <div className="w-2 h-2 rounded-full bg-navy" />
          <div className="w-2 h-2 rounded-full bg-navy opacity-20" />
          <div className="w-2 h-2 rounded-full bg-navy opacity-20" />
          <div className="w-2 h-2 rounded-full bg-navy opacity-20" />
        </div>
      </div>
    </div>
  );
}
