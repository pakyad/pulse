'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Clock, ShieldAlert, FileText, Globe, ArrowLeft, Home } from 'lucide-react';
import RunnerOnboarding from './onboarding/page'; 
import ActiveMissions from '../missions/page'; 

export default function RunHub() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unverified' | 'pending' | 'verified'>('loading');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setStatus('unverified');
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.is_verified_runner === true) {
            setStatus('verified');
          } else if (data.runner_status === 'pending') {
            setStatus('pending');
          } else {
            setStatus('unverified');
          }
        } else {
          setStatus('unverified');
        }
      } catch (error) {
        console.error("Verification check failed:", error);
        setStatus('unverified');
      }
    });
    return () => unsub();
  }, []);

  if (status === 'loading') {
      return (
        <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
        </main>
      );
  }

  // Handle Pending State Appearance
  if (status === 'pending') {
    return (
      <main className="h-screen h-[100svh] bg-[#FDFDFD] px-8 flex flex-col py-10 font-sans text-navy antialiased overflow-hidden">
        <button 
          onClick={() => router.push('/home')}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-navy hover:bg-slate-50 transition-all shadow-sm shrink-0"
        >
          <Home size={20} strokeWidth={1.5} />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-10">
           <div className="w-16 h-16 bg-blue-50 text-accent rounded-[2rem] flex items-center justify-center shadow-inner shrink-0">
             <Clock size={28} strokeWidth={1.5} />
           </div>

           <div className="space-y-3">
             <h1 className="text-[32px] font-bold tracking-tight leading-tight">Registry Under <br/> Review</h1>
             <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
               Your carrier application is currently being analyzed by the Pulse Protocol. Approval is typically cleared within 24 hours.
             </p>
           </div>

           <div className="space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Phase Status</h3>
             <div className="space-y-2">
                {[
                  { icon: ShieldAlert, label: 'Identity Vetting', status: 'In-Progress' },
                  { icon: FileText, label: 'Campus Authorization', status: 'Pending' },
                  { icon: Globe, label: 'Ledger Synchronization', status: 'Waiting' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className="text-slate-300" />
                      <span className="font-bold text-[14px]">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-accent">{item.status}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="pt-4">
              <p className="text-[12px] text-slate-400 font-medium text-center">
                You will receive a notification <br/> once your terminal is active.
              </p>
           </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {status === 'verified' ? <ActiveMissions /> : <RunnerOnboarding />}
    </>
  );
}
