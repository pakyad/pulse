'use client'

import { useState, useEffect } from 'react';
import { Train, Coffee, Activity } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function CampusVitals() {
  const [lrtTime, setLrtTime] = useState(4);
  const [cafeStatus, setCafeStatus] = useState('Peak Hour');
  const [weather, setWeather] = useState({ temp: 32, condition: 'Sunny' });

  useEffect(() => {
    // 1. LRT Simulation (Real-time countdown)
    const lrtTimer = setInterval(() => {
      setLrtTime((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 60000); // Update every minute

    // 2. Weather Fetch (Simulated or Real if possible)
    // For now, keeping it semi-dynamic with a slight random variance
    const weatherTimer = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temp: prev.temp + (Math.random() > 0.5 ? 0.1 : -0.1)
      }));
    }, 30000);

    // 3. Firestore Sync for Cafe Occupancy
    const unsub = onSnapshot(doc(db, 'vitals', 'occupancy'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCafeStatus(data.cafe || 'Available');
      }
    }, (err) => {
      console.warn("[Pulse Vitals] Firestore Sync Error:", err);
    });

    return () => {
      clearInterval(lrtTimer);
      clearInterval(weatherTimer);
      unsub();
    };
  }, []);

  return (
    <div className="fixed bottom-24 left-0 right-0 px-6 z-50 pointer-events-none">
      <div className="bg-white/70 backdrop-blur-xl border border-[#F2F2F7] h-8 rounded-full px-4 flex items-center justify-between shadow-sm max-w-sm mx-auto pointer-events-auto">
        <div className="flex items-center gap-2">
          <Train size={10} className="text-[#007AFF]" />
          <span className="text-[9px] font-medium text-[#1D1D1F]">LRT: {lrtTime}m away</span>
        </div>
        <div className="w-px h-3 bg-[#F2F2F7]" />
        <div className="flex items-center gap-2">
          <Coffee size={10} className="text-[#FF9500]" />
          <span className="text-[9px] font-medium text-[#1D1D1F]">Cafe: {cafeStatus}</span>
        </div>
        <div className="w-px h-3 bg-[#F2F2F7]" />
        <div className="flex items-center gap-2">
          <Activity size={10} className="text-[#5AC8FA]" />
          <span className="text-[9px] font-medium text-[#1D1D1F]">Active Runs: 12</span>
        </div>
      </div>
    </div>
  );
}
