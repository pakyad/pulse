"use client";

import React, { useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Wallet,
  CheckCircle2,
  Bell,
  ShieldCheck,
  Users,
  History,
  LogOut,
  Zap,
  Building2,
  FileText,
  Activity,
  Megaphone,
  CreditCard,
  UserCheck,
  LayoutGrid,
  Shield
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
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#0f172a] z-50 flex flex-col font-sans border-r border-slate-800">
      
      {/* Simple Branding */}
      <div className="p-8 pt-10">
        <h2 className="text-slate-100 font-bold text-xl tracking-tight">PULSE ADMIN</h2>
        <div className="h-[1px] w-8 bg-[#007AFF] mt-2 rounded-full" />
      </div>

      {/* Simplified Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar pb-10">
        {navStructure.map((section) => {
          const isExpanded = expanded === section.id;
          const hasActiveSub = section.subItems.some(item => item.id === activeModule);

          return (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors group ${
                  isExpanded || hasActiveSub ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon size={18} strokeWidth={2} className={isExpanded || hasActiveSub ? 'text-[#007AFF]' : 'text-slate-500'} />
                  <span className="text-[13px] font-semibold tracking-tight">
                    {section.label}
                  </span>
                </div>
                {isExpanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-500" />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-11 pr-4 py-1 space-y-0.5">
                      {section.subItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveModule(item.id)}
                          className={`w-full text-left p-2.5 rounded-md text-[12px] font-medium transition-colors ${
                            activeModule === item.id 
                            ? 'text-[#007AFF] bg-blue-500/5 font-bold' 
                            : 'text-slate-500 hover:text-slate-300'
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

      {/* Exit */}
      <div className="p-6 border-t border-slate-800">
        <button 
          onClick={handleExit}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-500 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          <span className="text-[12px] font-bold">Exit</span>
        </button>
      </div>
    </aside>
  );
}
