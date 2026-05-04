"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.data();
      if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
        router.push('/home'); return;
      }
      setLoading(false);
    });
    return () => checkAccess();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#E5E5EA] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans selection:bg-teal-100">
      
      {/* ── Fixed Sidebar (Column 1) ── */}
      <aside className="w-64 h-screen bg-[#FFFFFF] border-r border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
          <span className="text-[10px] font-bold bg-[#1C1C1E] text-white px-2 py-[2px] rounded-md uppercase tracking-wider">Admin</span>
        </div>

        {/* Directory Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Overview</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl transition-colors font-bold group">
            <svg className="w-5 h-5 text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Price Monitor</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Active Disputes</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">User Management</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area (Column 2) ── */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Sticky Top Bar */}
        <div className="bg-[#FFFFFF] sticky top-0 z-20 px-8 py-4 flex items-center justify-between border-b border-[#E5E5EA] shadow-[0_2px_10px_rgba(0,0,0,0.015)]">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center w-full h-10 rounded-xl bg-[#F9F9FB] overflow-hidden border border-transparent focus-within:border-[#E5E5EA] focus-within:bg-[#FFFFFF] transition-all">
              <div className="grid place-items-center h-full w-12 text-[#8E8E93]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input className="peer h-full w-full outline-none text-[15px] text-[#1C1C1E] pr-2 bg-transparent placeholder-[#AEAEB2]" type="text" id="search" placeholder="Search logs, tickets, users..." /> 
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5 ml-4">
             <button className="relative text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 border-2 border-[#FFFFFF] rounded-full"></span>
             </button>
             <div className="w-9 h-9 bg-[#1C1C1E] rounded-full flex items-center justify-center border border-[#E5E5EA] overflow-hidden cursor-pointer shadow-sm">
                <span className="text-[14px] font-bold text-white">A</span>
             </div>
          </div>
        </div>

        {/* Dashboard Content Container */}
        <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto">
          
          {/* Section 1: Price Monitoring Alerts */}
          <div className="bg-[#FFFFFF] rounded-[16px] border border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
             <div className="p-6 border-b border-[#E5E5EA]">
                 <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight">Price Monitoring Alerts</h2>
                 <p className="text-[14px] text-[#8E8E93] mt-1">System-flagged items exceeding campus price ceilings.</p>
             </div>
             
             <div className="divide-y divide-[#E5E5EA]">
                {/* Alert Item 1 */}
                <div className="p-6 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F2F2F7] rounded-lg flex items-center justify-center shrink-0">
                         <svg className="w-6 h-6 text-[#AEAEB2]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                         <h3 className="text-[15px] font-bold text-[#1C1C1E]">Basic Lab Coat</h3>
                         <p className="text-[13px] text-[#8E8E93] mt-0.5">MedSci Supplies</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-12">
                      <div>
                         <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Campus Guideline</p>
                         <p className="text-[15px] font-semibold text-[#1C1C1E]">RM 45.00</p>
                      </div>
                      <div>
                         <p className="text-[11px] font-bold text-red-600/80 uppercase tracking-wider mb-1">Listed Price</p>
                         <p className="text-[15px] font-bold text-red-600 flex items-center gap-1.5">
                            RM 120.00
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                         </p>
                      </div>
                      <div className="flex items-center gap-3 w-[300px] justify-end">
                         <button className="px-5 py-2.5 text-[13px] font-bold text-[#1C1C1E] border border-[#E5E5EA] rounded-[10px] hover:bg-[#F9F9FB] transition-colors">Approve Price</button>
                         <button className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1C1C1E] rounded-[10px] hover:bg-black transition-colors shadow-sm">Request Adjustment</button>
                      </div>
                   </div>
                </div>

                {/* Alert Item 2 */}
                <div className="p-6 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F2F2F7] rounded-lg flex items-center justify-center shrink-0">
                         <svg className="w-6 h-6 text-[#AEAEB2]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                         <h3 className="text-[15px] font-bold text-[#1C1C1E]">Engineering Calculus Kit</h3>
                         <p className="text-[13px] text-[#8E8E93] mt-0.5">MIIT Bookshop</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-12">
                      <div>
                         <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Campus Guideline</p>
                         <p className="text-[15px] font-semibold text-[#1C1C1E]">RM 80.00</p>
                      </div>
                      <div>
                         <p className="text-[11px] font-bold text-amber-600/80 uppercase tracking-wider mb-1">Listed Price</p>
                         <p className="text-[15px] font-bold text-amber-600 flex items-center gap-1.5">
                            RM 95.00
                         </p>
                      </div>
                      <div className="flex items-center gap-3 w-[300px] justify-end">
                         <button className="px-5 py-2.5 text-[13px] font-bold text-[#1C1C1E] border border-[#E5E5EA] rounded-[10px] hover:bg-[#F9F9FB] transition-colors">Approve Price</button>
                         <button className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1C1C1E] rounded-[10px] hover:bg-black transition-colors shadow-sm">Request Adjustment</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Section 2: Active Dispute Tickets */}
          <div className="bg-[#FFFFFF] rounded-[16px] border border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
             <div className="p-6 border-b border-[#E5E5EA]">
                 <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight">Active Disputes requiring mediation</h2>
             </div>
             
             <div className="divide-y divide-[#E5E5EA]">
                {/* Ticket 1 */}
                <div className="p-6 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-8">
                      <div>
                         <p className="text-[13px] font-bold text-[#1C1C1E] uppercase tracking-widest">#DSP_089</p>
                         <p className="text-[13px] text-[#8E8E93] mt-1">2 hrs ago</p>
                      </div>
                      <div>
                         <h3 className="text-[15px] font-bold text-[#1C1C1E]">Order never arrived</h3>
                         <p className="text-[14px] text-[#8E8E93] mt-0.5">Reported by: Iyad I.</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-8">
                      <span className="bg-amber-50 text-amber-600 px-3 py-[4px] rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                         Awaiting Admin
                      </span>
                      <button className="flex items-center gap-1.5 text-[14px] font-bold text-[#1C1C1E] group-hover:text-teal-600 transition-colors">
                         Review Case
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                   </div>
                </div>

                {/* Ticket 2 */}
                <div className="p-6 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors cursor-pointer group">
                   <div className="flex items-center gap-8">
                      <div>
                         <p className="text-[13px] font-bold text-[#1C1C1E] uppercase tracking-widest">#DSP_090</p>
                         <p className="text-[13px] text-[#8E8E93] mt-1">5 hrs ago</p>
                      </div>
                      <div>
                         <h3 className="text-[15px] font-bold text-[#1C1C1E]">Wrong item delivered</h3>
                         <p className="text-[14px] text-[#8E8E93] mt-0.5">Reported by: Naim F.</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-8">
                      <span className="bg-amber-50 text-amber-600 px-3 py-[4px] rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                         Awaiting Admin
                      </span>
                      <button className="flex items-center gap-1.5 text-[14px] font-bold text-[#1C1C1E] group-hover:text-teal-600 transition-colors">
                         Review Case
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                   </div>
                </div>

                {/* Ticket 3 - Resolved Example */}
                <div className="p-6 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors cursor-pointer group opacity-60">
                   <div className="flex items-center gap-8">
                      <div>
                         <p className="text-[13px] font-bold text-[#1C1C1E] uppercase tracking-widest">#DSP_085</p>
                         <p className="text-[13px] text-[#8E8E93] mt-1">1 day ago</p>
                      </div>
                      <div>
                         <h3 className="text-[15px] font-bold text-[#1C1C1E]">Vendor unresponsive</h3>
                         <p className="text-[14px] text-[#8E8E93] mt-0.5">Reported by: Ali R.</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-8">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-[4px] rounded-md text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                         Resolved
                      </span>
                      <button className="flex items-center gap-1.5 text-[14px] font-bold text-[#8E8E93] group-hover:text-teal-600 transition-colors">
                         View Log
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                   </div>
                </div>

             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
