"use client";

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, ChevronRight, X, ShieldCheck,
  Briefcase, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import AddMerchantModal from '@/components/admin/AddMerchantModal';

type Filter = 'ALL' | 'STUDENT' | 'MERCHANT' | 'RUNNER';

//  User Drawer 
function UserDrawer({ user, onClose, onToggle, onSuspend }: {
  user: any; onClose: () => void;
  onToggle: (id: string, field: string, current: boolean) => void;
  onSuspend: (id: string, current: boolean) => void;
}) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[500px] bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">User Profile</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={user.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
                className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold text-slate-900 tracking-tight">{user.full_name}</h3>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">{user.email}</p>
              {user.matric_no && <p className="text-[11px] font-bold text-slate-300  mt-1">{user.matric_no}</p>}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 ">Permissions</p>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Runner Access</p>
                  <p className="text-[11px] text-slate-400">Can accept delivery jobs</p>
                </div>
              </div>
              <button onClick={() => onToggle(user.id, 'is_verified_runner', user.is_verified_runner)}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${user.is_verified_runner ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <motion.div animate={{ x: user.is_verified_runner ? 28 : 4 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center">
                  <Briefcase size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Merchant Access</p>
                  <p className="text-[11px] text-slate-400">Can list items for sale</p>
                </div>
              </div>
              <button onClick={() => onToggle(user.id, 'is_seller', user.is_seller)}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${user.is_seller ? 'bg-slate-900' : 'bg-slate-200'}`}>
                <motion.div animate={{ x: user.is_seller ? 28 : 4 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>

          {/* Suspend */}
          <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100/50 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={18} />
              <p className="text-[14px] font-bold">Danger Zone</p>
            </div>
            <p className="text-[12px] text-red-700/60 leading-relaxed">
              Suspending this user immediately blocks all marketplace and delivery access.
            </p>
            <button onClick={() => onSuspend(user.id, user.is_suspended ?? false)}
              className={`w-full h-12 rounded-xl font-bold text-[12px]  transition-all active:scale-[0.98] ${
                user.is_suspended
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}>
              {user.is_suspended ? 'Restore Access' : 'Suspend User'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

//  Page 
export default function UsersPage() {
  const [users,          setUsers]          = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState<Filter>('ALL');
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState<any>(null);
  const [addMerchantOpen, setAddMerchantOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filterFn = (u: any) => {
    if (filter === 'RUNNER')   return u.is_verified_runner;
    if (filter === 'MERCHANT') return u.is_seller;
    if (filter === 'STUDENT')  return !u.is_verified_runner && !u.is_seller;
    return true;
  };

  const filtered = users
    .filter(filterFn)
    .filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const togglePermission = async (id: string, field: string, current: boolean) => {
    try { await updateDoc(doc(db, 'users', id), { [field]: !current }); } catch { /* ignore */ }
  };

  const toggleSuspend = async (id: string, current: boolean) => {
    try { await updateDoc(doc(db, 'users', id), { is_suspended: !current }); } catch { /* ignore */ }
    // Refresh selected
    setSelected((prev: any) => prev ? { ...prev, is_suspended: !current } : null);
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'STUDENT', label: 'Students' },
    { id: 'MERCHANT', label: 'Merchants' },
    { id: 'RUNNER', label: 'Runners' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">

      <AnimatePresence>
        {selected && (
          <UserDrawer user={selected} onClose={() => setSelected(null)}
            onToggle={(id, field, cur) => { togglePermission(id, field, cur); setSelected((p: any) => ({ ...p, [field]: !cur })); }}
            onSuspend={toggleSuspend} />
        )}
      </AnimatePresence>

      <AddMerchantModal isOpen={addMerchantOpen} onClose={() => setAddMerchantOpen(false)} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400  mb-1">People</p>
          <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Users</h1>
        </div>
        <button onClick={() => setAddMerchantOpen(true)}
          className="h-10 px-4 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl text-[12px] font-bold  flex items-center gap-2 transition-all active:scale-95">
          <UserPlus size={15} /> Add Merchant
        </button>
      </div>

      {/* Sticky Controls */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] -mx-8 px-8 py-3 flex items-center gap-3 flex-wrap shadow-none">
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100 gap-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${
                filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 ">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 ">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 ">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400  text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center">
                <Loader2 className="animate-spin text-slate-300 mx-auto" size={24} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center">
                <p className="text-[13px] font-bold text-slate-300">No users found</p>
              </td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} onClick={() => setSelected(u)}
                className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
                      <img src={u.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                        alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">{u.full_name}</p>
                      {u.matric_no && <p className="text-[10px] font-medium text-slate-400">{u.matric_no}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5 flex-wrap">
                    {u.is_seller && <span className="px-2 py-1 bg-amber-500 text-white text-[9px] font-semibold rounded-md">Merchant</span>}
                    {u.is_verified_runner && <span className="px-2 py-1 bg-blue-500 text-white text-[9px] font-semibold rounded-md">Runner</span>}
                    {u.is_suspended && <span className="px-2 py-1 bg-red-100 text-red-500 text-[9px] font-semibold rounded-md">Suspended</span>}
                    {!u.is_seller && !u.is_verified_runner && !u.is_suspended && <span className="px-2 py-1 bg-gray-50 text-gray-400 border border-gray-100 text-[9px] font-semibold rounded-md">Student</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[12px] text-slate-400 font-medium">{u.email}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 ml-auto">
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
