'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Bell, Lock, Shield, 
  Trash2, LogOut, ChevronRight, 
  Moon, Globe, HelpCircle, Info
} from 'lucide-react';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>{children}</h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>{children}</p>
);

const Toggle = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${enabled ? 'bg-slate-900' : 'bg-slate-200'}`}
  >
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ease-in-out ${enabled ? 'left-6' : 'left-1'}`} />
  </button>
);

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      return onSnapshot(doc(db, 'users', user.uid), (snap) => {
        setProfile(snap.data());
        setLoading(false);
      });
    });
    return () => unsub && unsub();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/auth');
  };

  if (loading) return null;

  const SETTING_GROUPS = [
    {
      label: 'Preferences',
      items: [
        { 
          icon: Bell, 
          label: 'Push Notifications', 
          type: 'toggle', 
          enabled: notifications, 
          onClick: () => setNotifications(!notifications) 
        },
        { 
          icon: Moon, 
          label: 'Dark Mode', 
          sub: 'Coming soon',
          type: 'toggle', 
          enabled: darkMode, 
          onClick: () => {} // setDarkMode(!darkMode) 
        },
        { 
          icon: Globe, 
          label: 'Language', 
          sub: 'English (MY)',
          type: 'link', 
          path: '#' 
        },
      ]
    },
    {
      label: 'Security & Privacy',
      items: [
        { icon: Lock, label: 'Change Password', type: 'link', path: '#' },
      ]
    },
    {
      label: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', type: 'link', path: '#' },
        { icon: Info, label: 'Terms of Service', type: 'link', path: '#' },
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      
      {/* ── LOCAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Settings</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 px-6 space-y-12">
        
        {SETTING_GROUPS.map((group, idx) => (
          <section key={idx} className="space-y-6">
            <div className="px-1 space-y-1">
              <Heading>{group.label}</Heading>
              <Subtext>Manage your {group.label.toLowerCase()} and preferences</Subtext>
            </div>
            <div className="space-y-1">
              {group.items.map((item, i) => (
                <div 
                  key={i}
                  className="w-full flex items-center justify-between py-4 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-800 tracking-tight">{item.label}</p>
                      {item.sub && <p className="text-[10px] text-[#94a3b8] font-medium">{item.sub}</p>}
                    </div>
                  </div>
                  
                  {item.type === 'toggle' ? (
                    <Toggle enabled={item.enabled!} onClick={item.onClick!} />
                  ) : (
                    <button onClick={() => item.path !== '#' && router.push(item.path)}>
                      <ChevronRight size={18} className="text-slate-200" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── DANGER ZONE ── */}
        <section className="space-y-6 pt-6 border-t border-slate-100">
          <div className="px-1 space-y-1">
            <Heading className="text-rose-500">Account Actions</Heading>
            <Subtext>Manage session and data privacy</Subtext>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleSignOut}
              className="w-full h-14 rounded-2xl bg-slate-50 flex items-center justify-between px-6 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Sign Out</span>
              </div>
              <ChevronRight size={16} className="text-slate-200" />
            </button>

            <button 
              className="w-full h-14 rounded-2xl bg-rose-50/30 border border-rose-50 flex items-center justify-between px-6 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
                <span className="text-[13px] font-bold text-rose-400 group-hover:text-rose-600 transition-colors">Delete Account</span>
              </div>
              <ChevronRight size={16} className="text-rose-100" />
            </button>
          </div>
        </section>

      </div>

    </main>
  );
}
