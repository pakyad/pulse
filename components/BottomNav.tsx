'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Home, Newspaper, Bike, Bell, User, ShoppingBag } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    let unsubSnap: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Cleanup previous listener
      if (unsubSnap) unsubSnap();

      if (user) {
        // Listen for active PENDING handshakes to show the notification badge
        const q = query(
          collection(db, "transactions"),
          where("buyer_id", "==", user.uid),
          where("status", "==", "PENDING")
        );

        unsubSnap = onSnapshot(q, (snap) => {
          setNotificationCount(snap.docs.length);
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Market', path: '/marketplace', icon: ShoppingBag },
    { name: 'Pulse', path: '/pulse', icon: Newspaper, isCenter: true },
    { name: 'Run', path: '/run', icon: Bike },
    { name: 'Me', path: '/me', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-white border-t border-[#E5E5E5] shadow-[0_-1px_10px_rgba(0,0,0,0.02)] pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] px-safe">
      <div className="flex justify-around items-end h-[56px] max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
                key={item.name} 
                href={item.path} 
                className="flex-1 flex flex-col items-center justify-center relative transition-all active:scale-95 duration-200"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              
              {/* Notification Badge */}
              {item.name === 'Me' && notificationCount > 0 && (
                <div className="absolute top-0 right-1/4 bg-[#FF3B30] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                  {notificationCount}
                </div>
              )}

              {/* Icon Container with Center Highlight logic */}
              <div className={`p-2 rounded-full mb-0.5 transition-all duration-300 ${item.isCenter ? (isActive ? 'bg-teal-500/10' : 'bg-slate-50/50') : ''}`}>
                <Icon 
                  size={24} 
                  strokeWidth={1.5}
                  className={isActive ? 'text-[#14B8A6]' : 'text-[#8E8E93]'} 
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-[#14B8A6]' : 'text-[#8E8E93]'}`}>
                {item.name}
              </span>

              {/* iOS Active Indicator Dot (4px) */}
              {isActive && !item.isCenter && (
                <div className="w-1 h-1 bg-[#14B8A6] rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
