'use client'

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

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

            // Runner Gating
            const isInRunModule = pathname?.startsWith('/run');
            const isOnboarding = pathname === '/run/onboarding';
            if (isInRunModule && !isOnboarding && userData.runner_status === 'none' && !userData.is_verified_runner) {
              router.replace('/run/onboarding');
            }
          }
        } catch (error) {
          console.error("Pulse Registry Shield Error:", error);
        }
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Only hide the global header on auth pages, root ('/'), me ('/me'), and merchant/admin terminals.
  const hideHeader = isAuthPage || pathname === '/' || pathname === '/me' || pathname === '/merchant' || pathname?.startsWith('/hub');
  const isMerchantTerminal = pathname?.startsWith('/merchant');
  const isRunTerminal = pathname?.startsWith('/run');

  // Block flash of student UI for Merchants
  if (!isAuthPage && checking) return null;
  if (role === 'CLUB' && !isMerchantTerminal) return null;

  const isDeepView = pathname === '/activity' || pathname?.startsWith('/messages');

  return (
    <>
      {!hideHeader && !pathname?.startsWith('/admin') && !isDeepView && <Header />}
      {/* Hide Student BottomNav for Industrial Terminals (Merchant, Admin) and Deep Views */}
      {!isMerchantTerminal && !pathname?.startsWith('/admin') && !isAuthPage && !isDeepView && <BottomNav />}
    </>
  );
}
