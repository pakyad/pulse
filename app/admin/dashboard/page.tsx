"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TreasuryView from '@/components/admin/TreasuryView';
import ApprovalList from '@/components/admin/ApprovalList';
import RegistryList from '@/components/admin/RegistryList';
import { Monitor, ChevronRight, Activity, Zap, ShieldCheck } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const moduleLabels: Record<string, { parent: string, label: string }> = {
  merchants: { parent: 'Approvals', label: 'New Merchants' },
  students: { parent: 'Approvals', label: 'New Students' },
  runners: { parent: 'Approvals', label: 'New Runners' },
  clubs: { parent: 'Approvals', label: 'Club List' },
  registry_mc: { parent: 'Registry', label: 'Medical Certs' },
  registry_appeal: { parent: 'Registry', label: 'Exam Appeals' },
  registry_letters: { parent: 'Registry', label: 'Official Letters' },
  broadcast: { parent: 'Send News', label: 'Alert Everyone' },
  news: { parent: 'Send News', label: 'Home News' },
  alerts: { parent: 'Send News', label: 'Emergency Button' },
  treasury: { parent: 'Sales Info', label: 'Total Sales' },
  analytics: { parent: 'Sales Info', label: 'Sales Stats' },
  moderation: { parent: 'Content', label: 'Check Items' },
  facilities: { parent: 'Content', label: 'Campus Status' },
  prestige: { parent: 'Content', label: 'Promotions' },
  users: { parent: 'People', label: 'Search People' },
  roles: { parent: 'People', label: 'Change Roles' },
  requests: { parent: 'People', label: 'Role Requests' },
  audit: { parent: 'History', label: 'Admin Logs' },
  health: { parent: 'History', label: 'App Status' },
};

export default function AdminDashboard() {
  const [activeModule, setActiveModule] = useState('treasury');
  const [isDesktop, setIsDesktop] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.data();

      if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
        router.push('/home');
        return;
      }

      const checkViewport = () => setIsDesktop(window.innerWidth >= 1024);
      checkViewport();
      window.addEventListener('resize', checkViewport);
      
      setLoading(false);
      return () => window.removeEventListener('resize', checkViewport);
    });

    return () => checkAccess();
  }, [router]);

  const activeMeta = useMemo(() => moduleLabels[activeModule] || { parent: 'Admin', label: activeModule }, [activeModule]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#007AFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center p-12 text-center">
        <Monitor size={32} className="text-[#007AFF] mb-6" />
        <h2 className="text-white font-bold text-xl mb-2">Use Desktop</h2>
        <p className="text-slate-400 text-sm max-w-[320px]">
          The Admin Portal works best on a computer.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#0A0F1E] flex overflow-hidden font-sans">
      <AdminSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto bg-white">
        
        <header className="px-12 pt-12 pb-8 border-b border-slate-50">
          <div className="max-w-6xl mx-auto flex justify-between items-end">
            <div>
              <nav className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{activeMeta.parent}</span>
                <ChevronRight size={10} className="text-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeMeta.label}</span>
              </nav>
              <h1 className="text-3xl font-bold tracking-tight text-[#0A0F1E]">{activeMeta.label}</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[13px] font-bold text-[#0A0F1E]">Admin User</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Level 3</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <section className="px-12 py-12 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'treasury' ? (
                <TreasuryView />
              ) : ['merchants', 'students', 'runners', 'clubs'].includes(activeModule) ? (
                <ApprovalList type={activeModule as any} />
              ) : activeModule.startsWith('registry_') ? (
                <RegistryList type={activeModule as any} />
              ) : (
                <div className="h-[40vh] w-full flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-[2.5rem]">
                  <Activity size={24} className="text-slate-200 mb-4" />
                  <h3 className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Coming Soon</h3>
                  <p className="text-slate-300 text-[10px] mt-1 uppercase tracking-widest">Preparing {activeMeta.label}...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="mt-20 px-12 pb-12 opacity-30 flex justify-between items-center max-w-6xl mx-auto">
           <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="w-1 h-1 rounded-full bg-[#007AFF]" />
              Pulse Core Active
           </div>
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">2026</p>
        </footer>
      </main>
    </div>
  );
}
