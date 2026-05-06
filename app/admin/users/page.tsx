"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  ShieldCheck, 
  User, 
  ChevronRight, 
  Mail,
  Smartphone,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function AdminUserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RUNNER' | 'MERCHANT' | 'STUDENT'>('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUsers: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      if (!u) { router.push('/auth'); return; }
      
      const userDoc = await getDoc(doc(db, "users", u.uid));
      const profile = userDoc.data();
      
      if (profile?.role !== 'ADMIN' && u.email !== 'admin@pulse.com') {
        router.push('/home'); return;
      }

      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUsers) unsubUsers();
    };
  }, [router]);

  const toggleVerification = async (userId: string, currentStatus: boolean, roleField: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        [roleField]: !currentStatus
      });
    } catch (e) {
      alert("Registry update failed.");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || 
                         (activeFilter === 'RUNNER' && u.is_verified_runner) ||
                         (activeFilter === 'MERCHANT' && u.is_seller) ||
                         (activeFilter === 'STUDENT' && !u.is_verified_runner && !u.is_seller);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans antialiased text-[#1C1C1E]">
      
      {/* ── Pulse Institutional Sidebar ── */}
      <aside className="w-[280px] h-screen bg-white border-r-[0.5px] border-[#F2F2F7] fixed left-0 top-0 flex flex-col z-30">
        <div className="px-8 py-12 flex flex-col gap-8">
           <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/dashboard')} className="p-2 -ml-2 text-[#8E8E93] hover:text-[#1C1C1E] transition-all active:scale-90"><ChevronLeft size={24} /></button>
              <h1 className="text-[22px] font-black tracking-tighter text-[#1C1C1E] uppercase">Registry</h1>
           </div>

           <div className="space-y-1">
             <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.3em] mb-4 pl-1">Directory Filter</p>
             {['ALL', 'STUDENT', 'RUNNER', 'MERCHANT'].map(f => (
               <button 
                 key={f}
                 onClick={() => setActiveFilter(f as any)}
                 className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${activeFilter === f ? 'bg-[#1C1C1E] text-white shadow-xl shadow-black/5' : 'text-[#8E8E93] hover:bg-[#F2F2F7]'}`}
               >
                  <span className="text-[13px] font-bold tracking-tight">{f} Registry</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${activeFilter === f ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-[#F2F2F7] text-[#8E8E93]'}`}>
                     {users.filter(u => f === 'ALL' ? true : f === 'RUNNER' ? u.is_verified_runner : f === 'MERCHANT' ? u.is_seller : (!u.is_verified_runner && !u.is_seller)).length}
                  </span>
               </button>
             ))}
           </div>
        </div>

        <div className="mt-auto p-8 border-t-[0.5px] border-[#F2F2F7]">
           <div className="bg-[#F2F2F7]/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-black">A</div>
              <div>
                 <p className="text-[12px] font-black uppercase tracking-wider text-black">Admin Mode</p>
                 <p className="text-[10px] font-bold text-black/40">Institutional Access</p>
              </div>
           </div>
        </div>
      </aside>

      {/* ── Registry Mainboard ── */}
      <main className="flex-1 ml-[280px] flex flex-col min-h-screen">
         
         {/* Institutional Search Bar */}
         <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-20 px-10 py-6 flex items-center justify-between border-b-[0.5px] border-[#F2F2F7]">
            <div className="flex-1 max-w-xl">
               <div className="relative flex items-center w-full h-14 rounded-2xl bg-[#F5F5F5] border-none transition-all group focus-within:bg-white focus-within:ring-1 ring-[#1C1C1E]/5 shadow-inner">
                  <div className="px-5 text-slate-300 group-focus-within:text-black transition-colors"><Search size={20} /></div>
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search Pulse Resident Directory..." 
                    className="w-full bg-transparent outline-none text-[15px] font-medium text-[#1C1C1E] placeholder:text-slate-300"
                  />
               </div>
            </div>
            <div className="flex items-center gap-4 pl-10">
               <button className="h-14 px-6 rounded-2xl bg-white border-[0.5px] border-[#F2F2F7] text-[13px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all shadow-sm">
                  Export Audit Log
               </button>
            </div>
         </div>

         {/* Identity Grid */}
         <div className="p-10">
            <div className="bg-white rounded-[32px] border-[0.5px] border-[#F2F2F7] overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[#FDFDFD] border-b-[0.5px] border-[#F2F2F7]">
                        <th className="px-8 py-6 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Institutional Identity</th>
                        <th className="px-8 py-6 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Verification State</th>
                        <th className="px-8 py-6 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Tenure</th>
                        <th className="px-8 py-6 text-[10px] font-black text-black/30 uppercase tracking-[0.2em] text-right">Audit</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y-[0.5px] divide-[#F2F2F7]">
                     {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-[#FDFDFD] transition-colors group cursor-pointer" onClick={() => setSelectedUser(u)}>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 overflow-hidden border-[0.5px] border-[#F2F2F7] shadow-sm">
                                    <img src={u.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`} alt="" />
                                 </div>
                                 <div>
                                    <p className="text-[16px] font-bold text-black tracking-tight">{u.full_name}</p>
                                    <p className="text-[12px] font-medium text-black/30">{u.student_id || 'Pulse ID: 8829-01'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex gap-2">
                                 {u.is_verified_runner && <span className="px-3 py-1.5 bg-[#1C1C1E] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} /> Runner</span>}
                                 {u.is_seller && <span className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Briefcase size={12} /> Merchant</span>}
                                 {!u.is_verified_runner && !u.is_seller && <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">Student</span>}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-[14px] font-bold text-black/40">Class of 2026</span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-black/20 group-hover:bg-black group-hover:text-white transition-all">
                                 <ChevronRight size={18} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </main>

      {/* ── IDENTITY AUDIT DRAWER (High-End Optical Sheet) ── */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="fixed inset-0 z-100 bg-black/20 backdrop-blur-md" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[540px] bg-white z-110 shadow-3xl flex flex-col"
            >
               <div className="p-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Audit Terminal</p>
                    <h2 className="text-[24px] font-black text-black uppercase tracking-tighter">Identity Review</h2>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-black/20 hover:text-black transition-colors"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
                  {/* Profile Spotlight */}
                  <div className="flex flex-col items-center text-center space-y-4 py-8">
                     <div className="w-32 h-32 rounded-[48px] overflow-hidden border-[0.5px] border-[#F2F2F7] shadow-2xl relative">
                        <img src={selectedUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.full_name}`} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                     </div>
                     <div>
                        <h3 className="text-[28px] font-black text-black tracking-tighter leading-none">{selectedUser.full_name}</h3>
                        <p className="text-[14px] font-bold text-black/30 mt-2">{selectedUser.email}</p>
                     </div>
                  </div>

                  {/* Institutional Controls */}
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] mb-6">Registry Authorization</p>
                     
                     <div className="p-8 rounded-[32px] bg-[#FDFDFD] border-[0.5px] border-[#F2F2F7] flex items-center justify-between group hover:border-black/5 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-black text-white rounded-[20px] flex items-center justify-center shadow-lg"><ShieldCheck size={28} /></div>
                           <div>
                              <p className="text-[17px] font-black text-black tracking-tight">Logistics Verification</p>
                              <p className="text-[13px] font-medium text-black/30">Verified Pulse Runner Node</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleVerification(selectedUser.id, selectedUser.is_verified_runner, 'is_verified_runner')}
                          className={`w-16 h-9 rounded-full relative transition-all duration-500 ${selectedUser.is_verified_runner ? 'bg-[#00927C]' : 'bg-black/10'}`}
                        >
                           <motion.div 
                             animate={{ x: selectedUser.is_verified_runner ? 30 : 6 }}
                             className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-lg"
                           />
                        </button>
                     </div>

                     <div className="p-8 rounded-[32px] bg-[#FDFDFD] border-[0.5px] border-[#F2F2F7] flex items-center justify-between group hover:border-black/5 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-lg"><Briefcase size={28} /></div>
                           <div>
                              <p className="text-[17px] font-black text-black tracking-tight">Merchant Authority</p>
                              <p className="text-[13px] font-medium text-black/30">Verified Pulse Vendor Node</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleVerification(selectedUser.id, selectedUser.is_seller, 'is_seller')}
                          className={`w-16 h-9 rounded-full relative transition-all duration-500 ${selectedUser.is_seller ? 'bg-[#007AFF]' : 'bg-black/10'}`}
                        >
                           <motion.div 
                             animate={{ x: selectedUser.is_seller ? 30 : 6 }}
                             className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-lg"
                           />
                        </button>
                     </div>
                  </div>

                  {/* Operational Telemetry */}
                  <div className="grid grid-cols-2 gap-4">
                     {[
                        { label: 'Campus ID', value: selectedUser.matric_no || 'Pending Auth', icon: GraduationCap },
                        { label: 'Mobile Auth', value: selectedUser.phone || 'N/A', icon: Smartphone },
                        { label: 'Registry Date', value: '24 May 2024', icon: Clock },
                        { label: 'Trust Score', value: '98.2%', icon: CheckCircle2 },
                     ].map(item => (
                        <div key={item.label} className="p-6 bg-white border-[0.5px] border-[#F2F2F7] rounded-[24px]">
                           <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] mb-4">{item.label}</p>
                           <div className="flex items-center gap-3">
                              <item.icon size={16} className="text-black/20" />
                              <span className="text-[15px] font-bold text-black truncate">{item.value}</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Disciplinary Protocol */}
                  <div className="p-8 bg-red-50/50 rounded-[32px] border-[0.5px] border-red-100/50 space-y-6">
                     <div className="flex items-center gap-4 text-red-600">
                        <AlertCircle size={24} />
                        <p className="text-[17px] font-black tracking-tight">Security Protocol</p>
                     </div>
                     <p className="text-[13px] text-red-800/40 font-medium leading-relaxed italic pr-4">"Suspending this node will immediately revoke all campus-wide logistics tokens and marketplace clearance."</p>
                     <button className="w-full h-16 bg-red-600 text-white rounded-[22px] font-black text-[13px] uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition-all">
                        Suspend Resident Node
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
