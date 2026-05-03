"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Package, Truck, ArrowRight, 
  Home, ShoppingBag, ShieldCheck, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push('/marketplace');
      return;
    }

    const fetchOrder = async () => {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        setOrder(snap.data());
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, router]);

  const handleCopy = () => {
    if (order?.order_code) {
      navigator.clipboard.writeText(order.order_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-navy rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-navy">
      
      {/* ── Success Header ── */}
      <section className="px-8 pt-24 pb-12 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-24 h-24 bg-[#00C4B4] rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-[#00C4B4]/20"
        >
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </motion.div>
        
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00C4B4]">Registry Locked</p>
          <h1 className="text-[32px] font-black tracking-tighter uppercase leading-none">Order Secured</h1>
        </div>
      </section>

      {/* ── Dynamic Order Code Module ── */}
      <section className="px-8 pb-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-navy text-white rounded-[3rem] p-10 flex flex-col items-center gap-8 shadow-2xl shadow-navy/30 border-4 border-white/5"
        >
          <div className="text-center space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Release Handshake</p>
            <p className="text-[14px] font-medium text-white/60">Present this code for fulfillment</p>
          </div>

          <div className="flex gap-3">
            {(order?.order_code || '------').split('').map((char: string, i: number) => (
              <div key={i} className="w-10 h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <span className="text-[28px] font-black tracking-tight">{char}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied to Clipboard' : 'Copy Code'}
          </button>
        </motion.div>
      </section>

      {/* ── Transaction Brief ── */}
      <section className="px-8 space-y-8">
        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border border-slate-100 shrink-0">
            {order?.image_url && <img src={order.image_url} className="w-full h-full object-cover" alt="" />}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Asset #ID-{orderId?.slice(0, 6)}</p>
            <h4 className="text-[16px] font-bold text-navy uppercase truncate">{order?.title}</h4>
            <p className="text-[18px] font-black text-navy">RM {Number(order?.price || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-3">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy/40">
                <ShieldCheck size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Security</p>
                <p className="text-[13px] font-bold text-navy">Buyer Protected</p>
             </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-3">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy/40">
                <Truck size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fulfillment</p>
                <p className="text-[13px] font-bold text-navy">{order?.delivery_type === 'RUNNER' ? 'Runner Logic' : 'Self Collect'}</p>
             </div>
          </div>
        </div>
      </section>

      {/* ── Action Command Center ── */}
      <div className="fixed bottom-0 left-0 right-0 px-8 pb-12 pt-8 bg-white/80 backdrop-blur-xl border-t border-slate-50">
        <div className="flex flex-col gap-3">
          <Link href={`/orders/${orderId}`}>
            <button className="w-full h-16 bg-navy text-white rounded-[2rem] font-black text-[15px] uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 flex items-center justify-center gap-3">
              Track Protocol <ArrowRight size={20} />
            </button>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/home">
              <button className="w-full h-14 bg-slate-50 border border-slate-100 text-navy rounded-2xl font-bold text-[13px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Home size={16} /> Hub
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="w-full h-14 bg-slate-50 border border-slate-100 text-navy rounded-2xl font-bold text-[13px] uppercase tracking-widest flex items-center justify-center gap-2">
                <ShoppingBag size={16} /> Shop
              </button>
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}
