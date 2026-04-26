'use client'

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function NavigationGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const isAuthPage = pathname?.startsWith('/auth');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // INSTITUTIONAL IDENTITY FIREWALL (Hard-locked for Demo)
        const isOfficialMerchant = user.email === 'testclub@pulse.com';
        const isOfficialStudent = ['iyad.mohmad@s.unikl.edu.my', 'iyad.iman@unikl.edu.my'].includes(user.email || '');

        if (isOfficialMerchant) {
           setRole('CLUB');
           if (!pathname?.startsWith('/merchant')) {
              router.replace('/merchant');
           }
           setChecking(false);
           return;
        }

        if (isOfficialStudent) {
           setRole('STUDENT');
           if (pathname?.startsWith('/merchant')) {
              router.replace('/home');
           }
           setChecking(false);
           return;
        }

        // Global Guard: Aggressive Role Lookup
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
             const userData = userSnap.data();
             const currentRole = userData.role;
             setRole(currentRole);

             // Institutional Tunneling logic
             if (currentRole === 'CLUB' && !pathname?.startsWith('/merchant')) {
                router.replace('/merchant');
             } else if (currentRole === 'STUDENT' && pathname?.startsWith('/merchant')) {
                router.replace('/home');
             }
          }
        } catch (error) {
          console.error("Shield Guard Error:", error);
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
