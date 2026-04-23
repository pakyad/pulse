'use client'
import { useRouter, usePathname } from 'next/navigation';
import { Search, Zap, ChevronLeft, LogOut, Bell, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

import { getDemoUser } from '@/lib/demo-utils';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Universal back visibility
  const isRootPage = false;

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
    <header className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 pt-2 pb-3">
      <div className="flex items-center gap-4 max-w-lg mx-auto">
        
        {/* 1. DYNAMIC BACK BUTTON */}
        {!isRootPage ? (
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all active:scale-90 flex items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <ChevronLeft size={24} strokeWidth={1.5} className="text-navy" />
          </button>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex-1" />

        {/* TOP-RIGHT CLUSTER: [ Bell ] [ Settings ] [ Avatar ] */}
        <div className="flex items-center gap-4 shrink-0">
           {/* 2. PERSISTENT INBOX (Bell) with Active Logic */}
           <button 
               onClick={() => router.push('/activity')}
               className={`transition-all relative p-2 active:scale-90 ${pathname === '/activity' ? 'text-[#007AFF]' : 'text-navy/40 hover:text-navy'}`}
           >
             <Bell 
               size={22} 
               strokeWidth={pathname === '/activity' ? 2.5 : 1.5} 
             />
             {notificationCount > 0 && (
               <div className="absolute top-1 right-1 bg-accent text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                   {notificationCount}
               </div>
             )}
           </button>

           {/* 3. SETTINGS ICON (Synced with Home) */}
           <button className="text-navy/40 hover:text-navy transition-colors p-2">
             <Settings size={22} strokeWidth={1.5} />
           </button>

           {/* 4. PROFILE AVATAR WITH DROPDOWN */}
           <div className="relative">
             <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-9 w-9 rounded-full bg-[#0A0F1E] flex items-center justify-center border-2 border-white shadow-xl overflow-hidden shrink-0 active:scale-90 transition-transform cursor-pointer"
             >
               {profile?.photo_url ? (
                 <img src={profile.photo_url} alt="Profile" className="h-full w-full object-cover" />
               ) : (
                 <span className="text-[11px] font-black text-white">
                   {profile?.full_name?.charAt(0) || 'P'}
                 </span>
               )}
             </div>

          {/* DROP DOWN LIST */}
          {showDropdown && (
            <div className="absolute top-[120%] right-0 w-44 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-black/10 p-2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
               <button 
                  onClick={() => {
                     auth.signOut().then(() => router.push('/auth'));
                     setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors group"
               >
                 <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                 <span className="text-[13px] font-bold text-navy group-hover:text-red-500 transition-colors">Sign Out</span>
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
}
