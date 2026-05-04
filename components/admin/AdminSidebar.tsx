"use client";

import React, { useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  LogOut,
  Megaphone,
  CreditCard,
  UserCheck,
  LayoutGrid,
  ShieldCheck,
  Users,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';

interface AdminSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  subItems: { id: string, label: string }[];
}

const navStructure: NavSection[] = [
  { 
    id: 'verify', 
    label: 'Approvals', 
    icon: UserCheck,
    subItems: [
      { id: 'merchants', label: 'New Merchants' },
      { id: 'students', label: 'New Students' },
      { id: 'runners', label: 'New Runners' },
      { id: 'clubs', label: 'Club List' }
    ]
  },
  { 
    id: 'news', 
    label: 'Send News', 
    icon: Megaphone,
    subItems: [
      { id: 'broadcast', label: 'Alert Everyone' },
      { id: 'news', label: 'Home News' },
      { id: 'alerts', label: 'Emergency Button' }
    ]
  },
  { 
    id: 'sales', 
    label: 'Sales Info', 
    icon: CreditCard,
    subItems: [
      { id: 'treasury', label: 'Total Sales' },
      { id: 'analytics', label: 'Sales Stats' }
    ]
  },
  { 
    id: 'content', 
    label: 'Content', 
    icon: LayoutGrid,
    subItems: [
      { id: 'moderation', label: 'Check Items' },
      { id: 'facilities', label: 'Campus Status' },
      { id: 'prestige', label: 'Promotions' }
    ]
  },
  { 
    id: 'registry', 
    label: 'Registry', 
    icon: ShieldCheck,
    subItems: [
      { id: 'registry_mc', label: 'Medical Certs' },
      { id: 'registry_appeal', label: 'Exam Appeals' },
      { id: 'registry_letters', label: 'Official Letters' }
    ]
  },
  { 
    id: 'people', 
    label: 'People', 
    icon: Users,
    subItems: [
      { id: 'users', label: 'Search People' },
      { id: 'roles', label: 'Change Roles' },
      { id: 'requests', label: 'Role Requests' }
    ]
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: History,
    subItems: [
      { id: 'audit', label: 'Admin Logs' },
      { id: 'health', label: 'App Status' }
    ]
  },
];

export default function AdminSidebar({ activeModule, setActiveModule }: AdminSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>('verify');
  const router = useRouter();

  const handleExit = async () => {
    await logoutUser();
    router.push('/auth');
  };

  const toggleSection = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white z-50 flex flex-col font-sans border-r-[0.5px] border-[#F2F2F7]">
      
      {/* Institutional Branding */}
      <div className="p-8 pt-16 mb-6">
        <h2 className="text-black font-black text-2xl tracking-tighter uppercase italic">Pulse<span className="text-[#00927C]">.</span></h2>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20 mt-1">Institutional Root</p>
      </div>

      {/* Synchronized Navigation */}
      <nav className="flex-1 px-6 space-y-1 overflow-y-auto no-scrollbar pb-10">
        {navStructure.map((section) => {
          const isExpanded = expanded === section.id;
          const hasActiveSub = section.subItems.some(item => item.id === activeModule);

          return (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-[12px] transition-all group ${
                  isExpanded || hasActiveSub ? 'bg-black/5 text-black' : 'text-black/40 hover:text-black hover:bg-black/[0.02]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <section.icon size={18} strokeWidth={2.5} className={isExpanded || hasActiveSub ? 'text-[#00927C]' : 'text-black/20'} />
                  <span className="text-[12px] font-black uppercase tracking-tight">
                    {section.label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-black/20" />
                ) : (
                  <ChevronRight size={14} className="text-black/10 group-hover:text-black/30" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pl-12 pr-2 py-2 space-y-1">
                      {section.subItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveModule(item.id)}
                          className={`w-full text-left p-2.5 rounded-[10px] text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeModule === item.id 
                            ? 'text-[#00927C] bg-[#00927C]/5' 
                            : 'text-black/30 hover:text-black'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Exit Directive */}
      <div className="p-8 border-t-[0.5px] border-[#F2F2F7]">
        <button 
          onClick={handleExit}
          className="flex items-center gap-4 w-full p-4 rounded-[16px] bg-black text-white hover:bg-black/90 transition-all group"
        >
          <LogOut size={16} className="text-white/40 group-hover:text-white transition-colors" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Terminate</span>
        </button>
      </div>
    </aside>
  );
}
