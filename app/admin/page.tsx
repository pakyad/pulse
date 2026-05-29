"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkRedirect = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.data();

      if (profile?.role === 'ADMIN' || user.email === 'admin@pulse.com') {
        router.push('/admin/dashboard');
      } else {
        router.push('/home'); // Students get sent back to home
      }
    });

    return () => checkRedirect();
  }, [router]);

  return (
    <div className="h-screen w-full bg-[#111111] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/10 border-t-[#007AFF] rounded-full animate-spin" />
    </div>
  );
}
