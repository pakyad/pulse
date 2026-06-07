"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { approveRunner, rejectRunner } from '@/app/actions/adminActions';
import { UserCheck, CheckCircle2, Loader2, X, AlertTriangle, PersonStanding, Car, Bike, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmDialog({ action, onClose, onConfirm, isWorking }: any) {
  let title = action === 'approve' ? "Approve Runner" : "Reject Application";
  let description = action === 'approve' 
    ? "This student will instantly gain access to the Runner Logistics Terminal and can start accepting delivery orders."
    : "This application will be rejected and the student will not be granted runner privileges. They can re-apply later.";

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full space-y-6">
        
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={isWorking}
            className="flex-1 h-11 rounded-xl text-[13px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(action)} disabled={isWorking}
            className={`flex-1 h-11 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center ${
              action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}>
            {isWorking ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Application Details Drawer ────────────────────────────────────────────────
function AppDetailsDrawer({ app, onClose, onResolve }: { app: any; onClose: () => void; onResolve: (action: string) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  if (!app) return null;

  const executeResolution = async (action: string) => {
    setIsWorking(true);
    await onResolve(action);
    setIsWorking(false);
    setConfirmAction(null);
    onClose();
  };

  return (
    <>
      {confirmAction && (
        <ConfirmDialog 
          action={confirmAction} 
          onClose={() => setConfirmAction(null)} 
          onConfirm={executeResolution} 
          isWorking={isWorking} 
        />
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Dossier</p>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Runner Application</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Student Identity</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900">{app.displayName || app.full_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Email Address</span>
                <span className="font-bold text-slate-900">{app.email}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-slate-500">Matric / Student ID</span>
                <span className="font-bold text-slate-900">{app.runner_data?.studentId || app.matric_no || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Logistics Capacity</h3>
            <div className="p-5 bg-white shadow-sm rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  {app.runner_data?.transport === 'Walking' ? <PersonStanding size={18} className="text-slate-600" /> :
                   app.runner_data?.transport === 'Car' ? <Car size={18} className="text-slate-600" /> : <Bike size={18} className="text-slate-600" />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Primary Transport</p>
                  <p className="text-[14px] font-bold text-slate-900">{app.runner_data?.transport || 'Walking'}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Coverage Area</p>
                <p className="text-[13px] font-semibold text-slate-700">{app.runner_data?.location || 'General Campus'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900">Operational Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">WhatsApp</p>
                <p className="text-[13px] font-bold text-slate-900">{app.runner_data?.whatsapp || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Bank Name</p>
                <p className="text-[13px] font-bold text-slate-900">{app.runner_data?.bankName || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Bank Account No.</p>
                <p className="text-[13px] font-bold text-slate-900 tracking-wider">{app.runner_data?.accountNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="p-8 border-t border-slate-100 bg-white space-y-4">
          <h3 className="text-[12px] font-bold text-slate-900">Adjudication Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setConfirmAction('reject')}
              className="h-12 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 transition-all group">
              <span className="text-[13px] font-bold text-slate-700 group-hover:text-red-700">Reject</span>
            </button>
            <button onClick={() => setConfirmAction('approve')}
              className="h-12 flex flex-col items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 transition-all group shadow-md shadow-slate-900/10">
              <span className="text-[13px] font-bold text-white">Approve Runner</span>
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminRunnersPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [deliveryCounts, setDeliveryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingApp, setViewingApp] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('runner_status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setApps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('is_verified_runner', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setApproved(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'DELIVERED')),
      (snap) => {
        const counts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const runnerId = d.data().runner_id;
          if (runnerId) counts[runnerId] = (counts[runnerId] || 0) + 1;
        });
        setDeliveryCounts(counts);
      }
    );
    return () => unsub();
  }, []);

  const handleAction = async (action: string) => {
    if (!viewingApp) return;
    try {
      let res;
      if (action === 'approve') res = await approveRunner(viewingApp.id);
      if (action === 'reject') res = await rejectRunner(viewingApp.id);
      
      if (!res?.success) throw new Error(res?.message || 'Failed to complete action');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const revokeRunner = async (id: string) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', id), {
        is_verified_runner: false,
        runner_status: 'rejected',
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      
      <AnimatePresence>
        {viewingApp && (
          <AppDetailsDrawer app={viewingApp} onClose={() => setViewingApp(null)} onResolve={handleAction} />
        )}
      </AnimatePresence>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[12px] font-medium text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 ml-4"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Network Expansion</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Runner Registry</h1>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Pending Applications</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Review and approve campus delivery runners.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {apps.length} Waiting
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : apps.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">No pending applications</p>
            </div>
          ) : (
            apps.map((app) => (
              <div key={app.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-100/50 transition-all">
                
                {/* Col 1-6: Applicant Info */}
                <div className="md:col-span-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                    <UserCheck size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">{app.displayName || app.full_name || 'Unknown Student'}</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{app.email}</p>
                  </div>
                </div>

                {/* Col 7-9: Transport */}
                <div className="md:col-span-3">
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">Primary Transport</p>
                  <p className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                    {app.runner_data?.transport === 'Walking' ? <PersonStanding size={14}/> :
                     app.runner_data?.transport === 'Car' ? <Car size={14}/> : <Bike size={14}/>}
                    {app.runner_data?.transport || 'Walking'}
                  </p>
                </div>

                {/* Col 10-12: Action Button */}
                <div className="md:col-span-3 flex items-center justify-end">
                  <button onClick={() => setViewingApp(app)}
                    className="h-10 px-6 rounded-xl text-[12px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
                    Review App
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approved Runners */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Approved Runners</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Currently active delivery runners on campus.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
            {approved.length} Active
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : approved.length === 0 ? (
            <div className="py-12 text-center">
              <UserCheck size={32} className="mx-auto mb-3 text-[#D1D5DB]" />
              <p className="text-[13px] font-bold text-[#6B7280]">No approved runners</p>
            </div>
          ) : (
            approved.map((runner) => {
              const deliveries = deliveryCounts[runner.id] || 0;
              const trustRating = runner.trustRating || 0;
              const initials = (runner.displayName || runner.full_name || 'U').charAt(0).toUpperCase();
              return (
              <div key={runner.id} className="h-16 px-5 bg-white rounded-xl border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-[#F9FAFB] transition-all">
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 text-[13px] font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{runner.displayName || runner.full_name || 'Unknown'}</p>
                    <p className="text-[11px] text-slate-400">{runner.email}</p>
                  </div>
                </div>
                <div className="md:col-span-2 text-[12px] text-slate-500">{deliveries} deliveries</div>
                <div className="md:col-span-3 flex items-center gap-1 text-[12px] text-amber-600">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {trustRating.toFixed(1)}
                </div>
                <div className="md:col-span-3 flex items-center justify-end">
                  <button onClick={() => revokeRunner(runner.id)}
                    className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all active:scale-95">
                    Revoke
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
