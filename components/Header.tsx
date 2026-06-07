'use client'
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronLeft, LogOut, Bell, Settings, ShoppingCart, MessageSquare } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import { getDemoUser } from '@/lib/demo-utils';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { useCart } from '@/lib/context/CartContext';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount } = useCart();

  const isRootPage = pathname === '/home';
  const showSearchBar = !pathname?.startsWith('/run');
  const displayName = profile?.full_name || auth.currentUser?.email?.split('@')[0] || 'Student';

  const handleBellTap = useCallback(async () => {
    const user = auth.currentUser;
    if (user && notificationCount > 0) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('user_id', '==', user.uid),
          where('is_read', '==', false)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach(d => batch.update(d.ref, { is_read: true }));
          await batch.commit();
        }
      } catch (e) {
        console.error('[Header] Failed to mark notifications as read:', e);
      }
    }
    router.push('/activity');
  }, [router, notificationCount]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubSnap = onSnapshot(doc(db, "users", user.uid), (snap) => {
          if (snap.exists()) setProfile(snap.data());
        });
        const q = query(
          collection(db, "notifications"),
          where("user_id", "==", user.uid),
          where("is_read", "==", false)
        );
        const unsubNotify = onSnapshot(q, (snap) => {
          setNotificationCount(snap.docs.length);
        });
        return () => {
          unsubSnap();
          unsubNotify();
        };
      } else {
        const demo = getDemoUser();
        if (demo) {
          setProfile(demo);
          setNotificationCount(1);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-100 w-full bg-[#FDFDFD]/95 backdrop-blur-2xl border-b border-slate-50 px-5 pt-4 pb-5">
        <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
          
          <AnimatePresence initial={false}>
            {!isRootPage && (
              <motion.button 
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 hover:bg-slate-100 active:scale-95 transition-all shrink-0 mr-1"
              >
                <ChevronLeft size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex-1 h-11 relative">
            <AnimatePresence>
              {showSearchBar && (
                <motion.button 
                  key="search-bar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setIsSearchOpen(true)} 
                  className="w-full h-11 bg-[#F5F5F5] rounded-xl flex items-center px-4 gap-3 transition-all active:scale-95 absolute inset-0 border-none"
                >
                  <Search size={20} className="text-slate-400" />
                  <span className="text-[14px] font-medium text-slate-400">What are you looking for?</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div layout transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => router.push('/cart')}
              className="transition-all relative p-2 text-navy/40 hover:text-navy active:scale-95"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[8px] font-semibold h-3.5 w-3.5 rounded-md flex items-center justify-center border-2 border-[#FDFDFD]">
                  {cartCount}
                </div>
              )}
            </button>

            <button 
              onClick={handleBellTap}
              className={`transition-all relative p-2 active:scale-95 ${pathname === '/activity' ? 'text-[#007AFF]' : 'text-navy/40 hover:text-navy'}`}
            >
              <Bell size={22} strokeWidth={pathname === '/activity' ? 2.5 : 2} />
              {notificationCount > 0 && (
                <div className="absolute top-1 right-1 bg-accent text-white text-[8px] font-semibold h-3.5 w-3.5 rounded-md flex items-center justify-center border-2 border-[#FDFDFD]">
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
