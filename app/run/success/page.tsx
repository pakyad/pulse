"use client";
import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Users, ShoppingBag } from 'lucide-react';

const SERVICE_CONFIG: Record<string, { bg: string, text: string, title: string, Icon: any, tint: string }> = {
  parcels: { 
    bg: 'bg-cyan-50', 
    text: 'text-cyan-600', 
    title: 'Finding a runner...', 
    Icon: Package,
    tint: 'bg-cyan-100 text-cyan-600'
  },
  errands: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    title: 'Finding a runner...', 
    Icon: Users,
    tint: 'bg-rose-100 text-rose-600'
  },
  default: { 
    bg: 'bg-slate-50', 
    text: 'text-slate-900', 
    title: 'Order confirmed.', 
    Icon: ShoppingBag,
    tint: 'bg-slate-200 text-slate-800'
  }
};

function RunSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const type = searchParams.get('type') || 'default';
  
  const config = SERVICE_CONFIG[type as keyof typeof SERVICE_CONFIG] || SERVICE_CONFIG.default;

  useEffect(() => {
    if (!orderId) {
      router.push('/run');
      return;
    }
    const timer = setTimeout(() => {
       router.push('/me/orders');
    }, 2800);
    return () => clearTimeout(timer);
  }, [orderId, router]);

  return (
    <main className={`min-h-screen ${config.bg} flex flex-col items-center justify-center p-6`}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
        className="flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          className={`w-32 h-32 rounded-[32px] flex items-center justify-center mb-6 bg-white shadow-md ${config.text}`}
        >
          <config.Icon size={56} strokeWidth={1.2} />
        </motion.div>

        <h1 className={`text-[18px] font-bold tracking-tight ${config.text} mb-1.5`}>{config.title}</h1>
        <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed max-w-[220px]">
          Taking you to tracking...
        </p>

      </motion.div>
    </main>
  );
}

export default function RunSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <RunSuccessContent />
    </Suspense>
  );
}
