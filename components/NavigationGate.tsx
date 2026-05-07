'use client'

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import FloatingActiveTask from '@/components/runner/FloatingActiveTask';

import { VETTED_ACCOUNTS } from '@/lib/utils/admin-seeding';
import { seedSEClubItems } from '@/lib/utils/seed-se-club';

/**
 * 🏛️ Pulse Navigation Gate | Institutional Governance
 * Enforces strict role isolation and layout barriers.
 */
export default function NavigationGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const isAuthPage = pathname?.startsWith('/auth');
  const isRoot = pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setProfile(null);
        setChecking(false);
        // Redirect to auth if trying to access protected paths
        if (!isAuthPage && !isRoot) router.replace('/auth');
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let userData: any = null;
        const vetting = VETTED_ACCOUNTS.find(a => a.email.toLowerCase() === user.email?.toLowerCase());

        if (!userSnap.exists() && vetting) {
          userData = { ...vetting, created_at: new Date().toISOString() };
          await setDoc(userRef, userData);
        } else if (userSnap.exists()) {
          userData = userSnap.data();
          if (vetting && (userData.role !== vetting.role || userData.is_verified_runner !== vetting.is_verified_runner)) {
            userData = { ...userData, ...vetting };
            await updateDoc(userRef, vetting);
          }
        }

        if (userData) {
          setRole(userData.role);
          setProfile(userData);

          // 🏛️ REQ_G001: ROLE ISOLATION LOGIC
          // Prevent horizontal privilege escalation
          
          const isMerchantPath = pathname?.startsWith('/merchant');
          const isAdminPath = pathname?.startsWith('/admin');
          const isRunPath = pathname?.startsWith('/run');
          const isDevPage = pathname === '/dev';

          if (isDevPage) {
            // Institutional bypass for development terminal
            setChecking(false);
            return;
          }

          if (userData.role === 'ADMIN') {
             if (!isAdminPath && !isAuthPage) router.replace('/admin/dashboard');
          } else if (userData.role === 'CLUB') {
             if (!isMerchantPath && !isAuthPage) router.replace('/merchant');
          } else if (userData.role === 'STUDENT') {
             if (isAdminPath) router.replace('/home');
             if (isMerchantPath) router.replace('/home');
          }

          // Trigger automated merchant seeding
          if (user.email === 'se-club@s.unikl.edu.my') {
            seedSEClubItems(user.uid);
          }
        }
      } catch (error) {
        console.error("Institutional Shield Failure:", error);
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // ── LAYOUT VISIBILITY PROTOCOL ──
  
  // Header Visibility (Institutional Silence)
  const hideHeader = 
    isAuthPage || 
    isRoot || 
    pathname === '/me' || 
    pathname?.startsWith('/merchant') || 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/run') || 
    pathname?.startsWith('/marketplace/');

  // BottomNav Visibility (Dynamic Lockdown)
  const showBottomNav = 
    !isAuthPage && 
    !isRoot && 
    !pathname?.startsWith('/admin') && 
    !pathname?.startsWith('/merchant') && 
    !pathname?.startsWith('/run') &&
    !pathname?.startsWith('/marketplace/');

  if (checking && !isAuthPage && !isRoot) return (
    <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
       <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {!hideHeader && <Header />}
      
      {/* Global Runner Dynamic Island (Only for active logistics) */}
      <FloatingActiveTask />

      {/* Dynamic Navigation lockdown */}
      {showBottomNav && <BottomNav />}
    </>
  );
}
