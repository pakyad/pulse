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

export default function NavigationGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const isAuthPage = pathname?.startsWith('/auth');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const vetting = VETTED_ACCOUNTS.find(a => a.email.toLowerCase() === user.email?.toLowerCase());
        
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          let userData: any = null;

          if (!userSnap.exists() && vetting) {
            // Initialize vetted account if missing from Firestore
            userData = { ...vetting, created_at: new Date().toISOString() };
            await setDoc(userRef, userData);
          } else if (userSnap.exists()) {
            userData = userSnap.data();
            // Sync vetted roles if they drift
            if (vetting && (userData.role !== vetting.role || userData.is_verified_runner !== vetting.is_verified_runner)) {
              userData = { ...userData, ...vetting };
              await updateDoc(userRef, vetting);
            }
          }

          if (userData) {
            setRole(userData.role);
            setProfile(userData);

            // Special Seeding for SE Club
            if (user.email === 'se-club@s.unikl.edu.my') {
              seedSEClubItems(user.uid);
            }

            // Routing Logic
            if (userData.role === 'CLUB' && !pathname?.startsWith('/merchant')) {
              router.replace('/merchant');
            } else if (userData.role === 'STUDENT' && pathname?.startsWith('/merchant')) {
              router.replace('/home');
            }

            // Runner Gating - Removed to allow students to access logistics directives on /run
          }
        } catch (error) {
          console.error("Pulse Registry Shield Error:", error);
        }
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Only hide the global header on auth pages, root ('/'), me ('/me'), merchant/admin terminals, and active mission terminal.
  const hideHeader = isAuthPage || pathname === '/' || pathname === '/me' || pathname === '/merchant' || pathname?.startsWith('/hub') || pathname?.startsWith('/run/active') || pathname?.startsWith('/me/orders') || pathname?.startsWith('/marketplace/');
  const isMerchantTerminal = pathname?.startsWith('/merchant');
  const isRunTerminal = pathname?.startsWith('/run') && profile?.is_verified_runner;
  const isActiveMission = pathname?.startsWith('/run/active');

  // Block flash of student UI for Merchants
  if (!isAuthPage && checking) return null;
  if (role === 'CLUB' && !isMerchantTerminal) return null;

  const isDeepView = pathname === '/activity' || pathname?.startsWith('/messages');

  return (
    <>
      {!hideHeader && !pathname?.startsWith('/admin') && !isDeepView && <Header />}
      
      {/* Global Runner Dynamic Island */}
      <FloatingActiveTask />

      {/* Hide Student BottomNav for Industrial Terminals (Merchant, Admin), Run Module, and Deep Views */}
      {!isMerchantTerminal && !pathname?.startsWith('/admin') && !isAuthPage && !isDeepView && !isRunTerminal && <BottomNav />}
    </>
  );
}
