"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy runner route — redirects to the active /run/terminal system.
export default function LegacyRunnerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/run/terminal');
  }, [router]);
  return null;
}
