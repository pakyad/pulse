'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  fallback?: string;
  variant?: 'default' | 'overlay';
}

export default function BackButton({ fallback = '/home', variant = 'default' }: BackButtonProps) {
  const router = useRouter();

  if (variant === 'overlay') {
    return (
      <button 
        onClick={() => router.back()} 
        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all shrink-0"
      >
        <ChevronLeft size={20} />
      </button>
    );
  }

  return (
    <button 
      onClick={() => {
        if (window.history.length > 2) {
          router.back();
        } else {
          router.push(fallback);
        }
      }} 
      className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 hover:bg-slate-100 active:scale-90 transition-all shrink-0"
    >
      <ChevronLeft size={20} />
    </button>
  );
}
