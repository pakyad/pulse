'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to the console  replace with Sentry/monitoring if needed
    console.error('[Pulse Error Boundary]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white font-sans antialiased flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 mb-8 border border-red-100">
        <AlertTriangle size={28} />
      </div>

      <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-2">
        Something went wrong
      </h1>
      <p className="text-[13px] font-medium text-[#94a3b8] leading-relaxed max-w-xs mb-10">
        An unexpected error occurred. This has been logged. Try refreshing the page or go back to the home screen.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px]  flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <RefreshCcw size={16} />
          Try Again
        </button>
        <button
          onClick={() => router.push('/home')}
          className="w-full h-14 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl font-bold text-[13px]  flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Home size={16} />
          Go Home
        </button>
      </div>

      {error.digest && (
        <p className="mt-8 text-[10px] font-mono text-slate-200 ">
          ref: {error.digest}
        </p>
      )}
    </main>
  );
}
