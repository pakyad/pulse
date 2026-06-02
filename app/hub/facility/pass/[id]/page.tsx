"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Monitor, 
  Lock,
  XCircle,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Share2
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function BookingPassPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      try {
        const snap = await getDoc(doc(db, "bookings", bookingId));
        if (snap.exists()) setBooking(snap.data());
      } catch {
        showToast('error', 'Could not load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Marks the booking as accessed in Firestore
  const handleOpenDoor = async () => {
    if (!bookingId || isOpening) return;
    setIsOpening(true);
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: 'ACCESSED',
        accessed_at: serverTimestamp(),
      });
      showToast('success', 'Access granted. Door unlocked.');
    } catch {
      showToast('error', 'Access failed. Please try again.');
    } finally {
      setIsOpening(false);
    }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-navy flex flex-col font-sans antialiased text-white overflow-hidden">

      {/* ── In-UI Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className={`fixed top-6 left-6 right-6 z-[300] px-5 py-4 rounded-2xl flex items-center gap-3 shadow-lg text-[13px] font-bold ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. DARK NAV ── */}
      <nav className="px-6 pt-12 pb-6 flex items-center justify-between z-10">
        <BackButton fallback="/pulse" />
        <div className="text-center">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Institutional Pass</p>
          <h1 className="text-[14px] font-bold tracking-widest text-white uppercase">Reservation Registry</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
          <Share2 size={18} />
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 gap-12">

        {/* ── 2. THE DYNAMIC PASS ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-md shadow-black/40 flex flex-col"
        >
          {/* Top Section: Facility Context */}
          <div className="bg-neutral-50 px-8 py-8 border-b border-neutral-100 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] mb-1.5 block">Facility Node</span>
              <h2 className="text-[20px] font-black text-navy tracking-tight">{booking?.facilityName || 'Global Hub'}</h2>
              <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                <MapPin size={12} /> Level 3 · MIIT Node
              </p>
            </div>
            <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white">
              <Lock size={22} />
            </div>
          </div>

          {/* Middle Section: Scan Ring */}
          <div className="flex-1 py-12 flex flex-col items-center justify-center relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-64 h-64 border-2 border-dashed border-navy/10 rounded-full"
            />
            <div className="relative z-10 w-48 h-48 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
              <svg viewBox="0 0 100 100" className="w-full h-full text-navy">
                <rect width="25" height="25" fill="currentColor" />
                <rect x="75" width="25" height="25" fill="currentColor" />
                <rect y="75" width="25" height="25" fill="currentColor" />
                <rect x="35" y="35" width="30" height="30" fill="currentColor" opacity="0.1" />
                <rect x="45" y="10" width="10" height="10" fill="currentColor" />
                <rect x="10" y="45" width="10" height="10" fill="currentColor" />
                <rect x="80" y="80" width="10" height="10" fill="currentColor" />
                <rect x="60" y="20" width="5" height="5" fill="currentColor" />
                <rect x="20" y="60" width="5" height="5" fill="currentColor" />
                <path d="M40,10 L50,10 M10,40 L10,50 M90,40 L90,50 M40,90 L50,90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-neutral-50 flex items-center justify-center text-navy">
                  <Zap size={20} className="fill-navy" />
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-[11px] font-black text-navy/20 uppercase tracking-[0.3em]">Scan at Access Node</p>
            </div>
          </div>

          {/* Bottom Section: Reservation Meta */}
          <div className="bg-navy p-8 grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Access Point</p>
              <div className="flex items-center gap-2 text-white">
                <Monitor size={14} className="text-white/40" />
                <span className="text-[15px] font-bold">POD {booking?.slotId || '--'}</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Duration</p>
              <div className="flex items-center gap-2 text-white">
                <Clock size={14} className="text-white/40" />
                <span className="text-[15px] font-bold">{booking?.duration || '1h'} Session</span>
              </div>
            </div>
            <div className="col-span-2 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-[11px] font-bold text-white/60 tracking-tight uppercase">Verified Student Pass</span>
              </div>
              <span className="text-[12px] font-mono text-white/20">#{bookingId ? bookingId.substring(0, 8) : ""}</span>
            </div>
          </div>
        </motion.div>

        {/* ── 3. ACTIONS ── */}
        <div className="w-full max-w-sm space-y-3">
          {/* Open Lab Door — writes status: 'ACCESSED' to Firestore */}
          <button
            onClick={handleOpenDoor}
            disabled={isOpening}
            className="w-full h-16 bg-white text-navy rounded-2xl font-bold text-[14px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {isOpening ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-navy" />}
            {isOpening ? 'Opening...' : 'Open Lab Door'}
          </button>
          <button
            onClick={() => router.push('/pulse')}
            className="w-full h-14 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-bold text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <XCircle size={16} />
            Cancel Reservation
          </button>
        </div>

      </div>

      {/* Floating Particle Decor */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
      <div className="absolute top-40 -right-20 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
    </main>
  );
}
