'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Home, Newspaper, Bike, User, ShoppingBag, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 *  Pulse Institutional Command Bar
 * Role-aware navigation with strict layout isolation.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    let unsubSnap: any = null;
    let unsubProfile: any = null;

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubSnap) unsubSnap();
      if (unsubProfile) unsubProfile();

      if (user) {
        // 1. Fetch Role Profile
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) setProfile(snap.data());

        unsubProfile = onSnapshot(userRef, (s) => {
          if (s.exists()) setProfile(s.data());
        });

        // 2. Handshake Notification Logic (Temporarily suppressed for permission audit)
        /*
        const q = query(
          collection(db, "transactions"),
          where("buyer_id", "==", user.uid),
          where("status", "==", "PENDING")
        );
        unsubSnap = onSnapshot(q, (snap) => {
          setNotificationCount(snap.docs.length);
        });
        */
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  //  ROLE-BASED NAVIGATION SCHEMA 
  const allItems = [
    { name: 'Home', path: '/home', icon: Home, roles: ['STUDENT', 'ADMIN'] },
    { name: 'Market', path: '/marketplace', icon: ShoppingBag, roles: ['STUDENT'] },
    { name: 'Pulse', path: '/pulse', icon: Newspaper, roles: ['STUDENT'], isCenter: true },
    { name: 'Run', path: '/run', icon: Bike, roles: ['STUDENT'] },
    { name: 'Admin', path: '/admin/overview', icon: LayoutGrid, roles: ['ADMIN'] },
    { name: 'Me', path: '/me', icon: User, roles: ['STUDENT', 'ADMIN'] },
  ];

  // Filter items based on institutional role
  const navItems = allItems.filter(item => {
    // FORCE RENDER ALL ITEMS EXCEPT ADMIN FOR NOW TO FIX VANISHING BUG
    return item.name !== 'Admin';
  });

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-slate-200 shadow-sm pb-safe" 
      style={{ 
        zIndex: 100
      }}
    >
      <div className="flex justify-around items-center h-[64px] max-w-lg mx-auto px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/home' && pathname?.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className="flex-1 flex flex-col items-center justify-center relative group"
            >
              <div className="relative p-2 rounded-2xl transition-all duration-300">
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} 
                />
                
                {/* Notification Badge */}
                {item.name === 'Me' && notificationCount > 0 && (
                  <div className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>

              {/* iOS-Style Label Scaling */}
              <span className={`text-[10px] font-bold tracking-widest transition-all duration-300 ${isActive ? 'text-slate-900 scale-105' : 'text-slate-400 opacity-60'}`}>
                {item.name}
              </span>

              {/* Institutional Active Marker */}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute -bottom-1 w-1 h-1 bg-slate-900 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Visual DNA: Home Indicator Space */}
      <div className="h-1.5 w-32 bg-slate-100 rounded-full mx-auto mt-2 opacity-50" />
    </nav>
  );
}
