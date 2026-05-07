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
import { seedKelabBolaItems } from '@/lib/utils/seed-kelab-bola';

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
          // 🏛️ SYNC REQ_S101: Sync all vetting flags if they differ from Firestore
          const needsSync = vetting && (
            userData.role !== vetting.role || 
            userData.is_verified_runner !== vetting.is_verified_runner ||
            userData.is_verified_merchant !== vetting.is_verified_merchant ||
            userData.is_official !== vetting.is_official
          );
          
          if (needsSync) {
            userData = { ...userData, ...vetting };
            await updateDoc(userRef, { ...vetting });
          }
        }

        if (userData) {
          setRole(userData.role);
          setProfile(userData);

          // 🏛️ REQ_G001: ROLE ISOLATION LOGIC
          // Prevent horizontal privilege escalation
          
          const isMerchantPath = pathname?.startsWith('/merchant');
          const isAdminPath = pathname?.startsWith('/admin');
          const isRunPath = pathname?.startsWith('/run') || pathname?.startsWith('/runner');
          const isDevPage = pathname === '/dev';

          if (isDevPage) {
            // Institutional bypass for development terminal
            setChecking(false);
            return;
          }

          if (userData.role === 'ADMIN') {
             if (!isAdminPath && !isAuthPage) router.replace('/admin/dashboard');
          } else if (userData.role === 'CLUB') {
             const isAllowedSharedPath = 
               pathname === '/me' || 
               pathname === '/activity' || 
               pathname?.startsWith('/me/orders') || 
               pathname?.startsWith('/orders/');
               
             if (!isMerchantPath && !isAllowedSharedPath && !isAuthPage) {
                router.replace('/merchant');
             }
          } else if (userData.role === 'STUDENT') {
             // 🏛️ REQ_G001: STRICT ROLE LOCKDOWN
             if (isAdminPath || isMerchantPath) {
               router.replace('/home');
             }
             
             // 🏛️ REQ_G102: UNVERIFIED LOCKDOWN
             // Bar unverified students from sensitive logistics terminals
             if (pathname?.startsWith('/run/terminal') && !userData.is_verified_runner) {
               router.replace('/run');
             }
          }

          // Trigger automated merchant seeding
          if (user.email === 'se-club@s.unikl.edu.my') {
            seedSEClubItems(user.uid);
          }
          if (user.email === 'kelab-bola@s.unikl.edu.my' || user.email === 'kelabbola@s.unikl.edu.my') {
            seedKelabBolaItems(user.uid);
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
    pathname === '/activity' || 
    pathname?.startsWith('/merchant') || 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/run') || 
    pathname?.startsWith('/marketplace/');

  // BottomNav Visibility (Dynamic Suppression)
  const showBottomNav = 
    !isAuthPage && 
    !isRoot && 
    !pathname?.startsWith('/admin') && 
    !pathname?.startsWith('/merchant') &&
    !(role === 'CLUB' && (pathname === '/me' || pathname === '/activity' || pathname?.startsWith('/me/orders')));

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
