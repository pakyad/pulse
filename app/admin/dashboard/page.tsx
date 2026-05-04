"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TreasuryView from '@/components/admin/TreasuryView';
import ApprovalList from '@/components/admin/ApprovalList';
import RegistryList from '@/components/admin/RegistryList';
import { Monitor, ChevronRight, Activity, Zap, ShieldCheck, Bell } from 'lucide-react';
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
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-[0.5px] border-black/5 border-t-[#00927C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center p-12 text-center">
        <Monitor size={48} className="text-[#00927C] mb-8" />
        <h2 className="text-black font-black text-2xl uppercase tracking-tighter mb-4">Desktop Authorization Required</h2>
        <p className="text-black/40 text-[11px] font-black uppercase tracking-[0.2em] max-w-[320px]">
          The Admin Interface requires a high-resolution viewport for secure operations.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex overflow-hidden font-sans antialiased">
      <AdminSidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <main className="flex-1 ml-[260px] h-screen overflow-y-auto bg-white">
        
        {/* Institutional Header */}
        <header className="px-12 pt-16 pb-10 border-b-[0.5px] border-[#F2F2F7] sticky top-0 bg-white/90 backdrop-blur-xl z-[40]">
          <div className="max-w-6xl mx-auto flex justify-between items-end">
            <div>
              <nav className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">{activeMeta.parent}</span>
                <ChevronRight size={12} className="text-black/10" />
                <span className="text-[10px] font-black text-[#00927C] uppercase tracking-[0.3em]">{activeMeta.label}</span>
              </nav>
              <h1 className="text-[32px] font-black tracking-tighter text-black uppercase leading-none">{activeMeta.label}</h1>
            </div>
            
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-6">
                <button className="relative p-2 text-black/20 hover:text-black transition-colors">
                  <Bell size={20} />
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00927C] rounded-full" />
                </button>
                <div className="h-8 w-[0.5px] bg-[#F2F2F7]" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[13px] font-black uppercase tracking-tight text-black leading-none mb-1">System Admin</p>
                  <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.3em]">Institutional L3</p>
                </div>
                <div className="w-12 h-12 rounded-[16px] bg-slate-50 border-[0.5px] border-[#F2F2F7] overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover grayscale" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <section className="px-12 py-16 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {activeModule === 'treasury' ? (
                <TreasuryView />
              ) : ['merchants', 'students', 'runners', 'clubs'].includes(activeModule) ? (
                <ApprovalList type={activeModule as any} />
              ) : activeModule.startsWith('registry_') ? (
                <RegistryList type={activeModule as any} />
              ) : (
                <div className="h-[50vh] w-full flex flex-col items-center justify-center bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px]">
                  <Activity size={32} className="text-black/5 mb-6" />
                  <h3 className="text-black/20 font-black text-[12px] tracking-[0.3em] uppercase">Module Hibernating</h3>
                  <p className="text-black/10 text-[10px] mt-2 uppercase tracking-[0.2em]">Deployment of {activeMeta.label} in progress...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Footer Audit */}
        <footer className="mt-20 px-12 pb-16 opacity-30 flex justify-between items-center max-w-6xl mx-auto border-t-[0.5px] border-[#F2F2F7] pt-12">
           <div className="flex items-center gap-3 text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00927C] animate-pulse" />
              Pulse Core v2.4.0 • Authorized Session
           </div>
           <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">MMXXVI</p>
        </footer>
      </main>
    </div>
  );
}
