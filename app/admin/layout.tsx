"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  LayoutGrid, Inbox, ShieldCheck, ShieldAlert, Users,
  MessageSquare, ScrollText, Settings, LogOut, Archive, UserCheck, Wallet,
  Megaphone
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin/overview',       label: 'Overview',           icon: LayoutGrid   },
      { href: '/admin/escrow',         label: 'Escrow Control',     icon: Wallet       },
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { href: '/admin/price-review',   label: 'Price Review',       icon: ShieldCheck,   badgeKey: 'priceReview' },
      { href: '/admin/appeals',        label: 'Price Appeals',      icon: MessageSquare, badgeKey: 'appeals' },
      { href: '/admin/disputes',       label: 'Disputes',           icon: ShieldAlert,   badgeKey: 'disputes' },
    ]
  },
  {
    title: 'NETWORK',
    items: [
      { href: '/admin/runners',        label: 'Runner Apps',        icon: UserCheck,     badgeKey: 'runnerApps' },
      { href: '/admin/users',          label: 'User Registry',      icon: Users        },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/vault',          label: 'Governance Vault',   icon: Archive      },
      { href: '/admin/logs',           label: 'Activity Logs',      icon: ScrollText   },
      { href: '/admin/settings',       label: 'Settings',           icon: Settings     },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready,  setReady]  = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) { router.push('/auth'); return; }
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.data();
        if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
          router.push('/home'); return;
        }
        setReady(true);
      } catch (err) { console.error('[Admin Layout] Auth error:', err); }
    });
    return () => unsub();
  }, [router]);

  // ── Real-time badge counts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    const unsubPriceReview = onSnapshot(
      query(collection(db, 'items'), where('is_price_flagged', '==', true)),
      (s) => setBadges(b => ({ ...b, priceReview: s.size }))
    );
    const unsubDisputes = onSnapshot(
      query(collection(db, 'disputes'), where('status', '==', 'AWAITING_ADMIN')),
      (s) => setBadges(b => ({ ...b, disputes: s.size }))
    );
    const unsubAppeals = onSnapshot(
      query(collection(db, 'appeals'), where('status', '==', 'PENDING')),
      (s) => setBadges(b => ({ ...b, appeals: s.size }))
    );
    const unsubRunners = onSnapshot(
      query(collection(db, 'users'), where('runner_status', '==', 'pending')),
      (s) => setBadges(b => ({ ...b, runnerApps: s.size }))
    );

    return () => { unsubPriceReview(); unsubDisputes(); unsubAppeals(); unsubRunners(); };
  }, [ready]);

  if (!ready) return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#E5E5EA] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className="w-64 h-screen bg-white border-r border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">

        {/* Brand */}
        <div className="px-6 py-8 flex items-center gap-3 border-b border-[#F2F2F7]">
          <div className="w-9 h-9 bg-[#1C1C1E] rounded-xl flex items-center justify-center shadow-md shadow-slate-900/10">
            <span className="text-white font-semibold text-[18px]">P</span>
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#1C1C1E] tracking-tighter leading-none">Pulse</h1>
            <p className="text-[8px] font-semibold bg-emerald-500 text-white px-2 py-[2px] rounded-md  mt-1 inline-block">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-[#AEAEB2] tracking-wider mb-2">{section.title}</p>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const badge    = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#F2F2F7] text-[#1C1C1E]'
                        : 'text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                      <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                    {badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5EA]">
          <button
            onClick={() => { auth.signOut(); router.push('/auth'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 rounded-xl transition-all font-semibold group"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="text-[13px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-20 px-8 py-4 flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex-1 max-w-xs">
            <div className="relative h-9 rounded-xl bg-[#F9F9FB] border border-transparent focus-within:border-[#E5E5EA] transition-all flex items-center gap-2 px-3">
              <span className="text-[#AEAEB2] text-[13px]">⌘</span>
              <input
                className="flex-1 bg-transparent outline-none text-[13px] text-[#1C1C1E] placeholder-[#AEAEB2] font-medium"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-semibold text-[#AEAEB2] ">Admin</p>
              <p className="text-[12px] font-bold text-[#1C1C1E]">{auth.currentUser?.displayName || 'Admin'}</p>
            </div>
            <div className="w-9 h-9 bg-slate-900 rounded-xl border border-slate-100 shadow-sm" />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
