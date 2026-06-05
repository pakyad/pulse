'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[80px] font-semibold text-slate-50 leading-none tracking-tighter mb-2 select-none">
        404
      </p>

      <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-2">
        Page not found
      </h1>
      <p className="text-[13px] font-medium text-[#94a3b8] leading-relaxed max-w-xs mb-10">
        This page doesn&apos;t exist or may have been moved. Check the link and try again.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => router.push('/home')}
          className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px]  flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Home size={16} />
          Go Home
        </button>
        <button
          onClick={() => router.back()}
          className="w-full h-14 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl font-bold text-[13px]  flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </main>
  );
}
