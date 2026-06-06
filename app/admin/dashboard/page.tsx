"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/overview'); }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-[1.5px] border-[#E5E5EA] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );
}
