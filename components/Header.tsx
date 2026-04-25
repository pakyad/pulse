'use client'
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronLeft, LogOut, Bell, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import { getDemoUser } from '@/lib/demo-utils';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Universal back visibility - ONLY Home is absolute root
  const isRootPage = pathname === '/home';
  const showSearchBar = !pathname?.startsWith('/run');
  const displayName = profile?.full_name || auth.currentUser?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
        if (user) {
            const unsubSnap = onSnapshot(doc(db, "users", user.uid), (snap) => {
                if (snap.exists()) setProfile(snap.data());
            });

            // Listen for active PENDING handshakes for the notification badge
            const q = query(
              collection(db, "transactions"),
              where("buyer_id", "==", user.uid),
              where("status", "==", "PENDING")
            );
            const unsubNotify = onSnapshot(q, (snap) => {
              setNotificationCount(snap.docs.length);
            });

            return () => {
              unsubSnap();
              unsubNotify();
            };
        } else {
            // Fallback to Demo Mode
            const demo = getDemoUser();
            if (demo) {
              setProfile(demo);
              setNotificationCount(1); // Demo notification
            }
        }
    });
    return () => unsubAuth();
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
          
          <AnimatePresence initial={false}>
            {!isRootPage && (
              <motion.button 
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => router.back()} 
                className="p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-all active:scale-90 flex items-center justify-center shrink-0"
              >
                <ChevronLeft size={28} strokeWidth={2} className="text-navy" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex-1 w-full relative">
            <AnimatePresence>
              {showSearchBar && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setIsSearchOpen(true)} 
                  className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 gap-3 transition-all active:scale-[0.98] absolute inset-0"
                >
                  <Search size={18} className="text-slate-300" />
                  <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex items-center gap-3 shrink-0">
            <button 
                onClick={() => router.push('/activity')}
                className={`transition-all relative p-2 active:scale-90 ${pathname === '/activity' ? 'text-[#007AFF]' : 'text-navy/40 hover:text-navy'}`}
            >
              <Bell size={22} strokeWidth={pathname === '/activity' ? 2.5 : 2} />
              {notificationCount > 0 && (
                <div className="absolute top-1 right-1 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-md flex items-center justify-center border-2 border-[#FDFDFD]">
                    {notificationCount}
                </div>
              )}
            </button>

            <AvatarDropdown 
              photoUrl={profile?.photo_url} 
              userName={displayName} 
            />
          </motion.div>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
