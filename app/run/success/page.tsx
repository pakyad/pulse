"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const SERVICE_THEMES: Record<string, { bg: string, text: string, border: string, stroke: string }> = {
  parcels: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', stroke: '#0891b2' },
  academic: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', stroke: '#7c3aed' },
  errands: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', stroke: '#e11d48' },
  default: { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200', stroke: '#0f172a' }
};

function RunSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const type = searchParams.get('type') || 'default';
  
  const theme = SERVICE_THEMES[type as keyof typeof SERVICE_THEMES] || SERVICE_THEMES.default;
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!orderId) {
      router.push('/run');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/me/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      {/* Exit */}
      <button onClick={() => router.push('/run')}
        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 transition-all">
        <X size={20} />
      </button>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
        className="flex flex-col items-center text-center max-w-sm">
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${theme.bg} ${theme.border} border-2`}>
          <Check size={48} className={theme.text} strokeWidth={2.5} />
        </div>

        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight mb-2">Request Broadcasted</h1>
        <p className="text-[14px] font-medium text-slate-500 mb-12">
          Your courier request has been sent to the network. A campus runner will pick it up shortly.
        </p>

        {/* Circular Auto-Redirect Button */}
        <button onClick={() => router.push('/me/orders')}
          className="relative flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] bg-white border-[1.5px] border-slate-100 shadow-sm active:scale-95 transition-all group hover:border-slate-300">
          
          <div className="relative flex items-center justify-center">
            {/* Background track */}
            <svg className="w-8 h-8 transform -rotate-90">
              <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-slate-100" />
              {/* Progress ring */}
              <motion.circle cx="16" cy="16" r="12" stroke={theme.stroke} strokeWidth="2.5" fill="transparent"
                strokeDasharray={2 * Math.PI * 12}
                animate={{ strokeDashoffset: [2 * Math.PI * 12, 0] }}
                transition={{ duration: 5, ease: "linear" }}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-[11px] font-bold ${theme.text}`}>{timeLeft}</span>
          </div>

          <span className="text-[14px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
            Track My Courier
          </span>
        </button>

      </motion.div>
    </main>
  );
}

export default function RunSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <RunSuccessContent />
    </Suspense>
  );
}
