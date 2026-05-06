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
    <nav className="fixed bottom-0 left-0 right-0 z-100 bg-white border-t border-[#E5E5E5] pb-2 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
      <div className="flex justify-around items-end h-[60px] max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
                key={item.name} 
                href={item.path} 
                className="flex-1 flex flex-col items-center justify-center relative py-1 transition-all active:scale-95 duration-200"
            >
              
              {/* Notification Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-0 right-1/4 bg-[#FF3B30] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                  {item.badge}
                </div>
              )}

              {/* Icon Container with Center Highlight logic */}
              <div className={`p-2 rounded-full mb-0.5 transition-all duration-300 ${item.isCenter ? (isActive ? 'bg-blue-500/10' : 'bg-blue-50/50') : ''}`}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'} 
                />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-black  transition-colors ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
                {item.name}
              </span>

              {/* iOS Active Indicator Dot */}
              {isActive && !item.isCenter && (
                <div className="w-1 h-1 bg-[#007AFF] rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Home Indicator line (iOS Style) */}
      <div className="h-1 w-32 bg-[#E5E5E5] rounded-full mx-auto mt-3" />
    </nav>
  );
}
