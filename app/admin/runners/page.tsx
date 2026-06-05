'use client'
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserCheck, Check, X, Car, Bike, PersonStanding } from 'lucide-react';

export default function AdminRunners() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('runner_status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApps(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'users', id), {
      runner_status: 'approved',
      is_verified_runner: true
    });
  };

  const handleReject = async (id: string) => {
    // We set to none so they can reapply if they want, or we could set to 'rejected'
    await updateDoc(doc(db, 'users', id), {
      runner_status: 'none',
    });
  };

  if (loading) return <div className="text-sm font-medium text-[#8E8E93]">Loading applications...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1C1C1E] tracking-tight">Runner Applications</h1>
        <p className="text-[14px] text-[#8E8E93] font-medium mt-1">Review and approve campus delivery runners.</p>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#8E8E93] mb-4">
            <UserCheck size={24} />
          </div>
          <h3 className="text-[16px] font-bold text-[#1C1C1E]">No pending applications</h3>
          <p className="text-[13px] text-[#8E8E93] font-medium mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {apps.map(app => (
            <div key={app.id} className="bg-white border border-[#E5E5EA] rounded-2xl p-6 flex flex-col gap-6">
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F9F9FB] border border-[#E5E5EA] rounded-xl flex items-center justify-center text-[#1C1C1E]">
                    {app.runner_data?.transport === 'Walking' ? <PersonStanding size={20} /> :
                     app.runner_data?.transport === 'Car' ? <Car size={20} /> : <Bike size={20} />}
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1C1C1E]">{app.displayName || 'Unknown Student'}</h2>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-[#8E8E93] mt-0.5">
                      <span className="bg-[#F2F2F7] px-2 py-0.5 rounded-md text-[#1C1C1E]">{app.runner_data?.studentId}</span>
                      <span>•</span>
                      <span>{app.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F2F2F7]">
                <div>
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Logistics</p>
                  <p className="text-[13px] font-bold text-[#1C1C1E]">{app.runner_data?.location}</p>
                  <p className="text-[13px] font-medium text-[#8E8E93]">{app.runner_data?.transport}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-[13px] font-bold text-[#1C1C1E]">WhatsApp: {app.runner_data?.whatsapp}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">Bank Details</p>
                  <p className="text-[13px] font-bold text-[#1C1C1E]">{app.runner_data?.bankName} — {app.runner_data?.accountNumber}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => handleApprove(app.id)}
                  className="flex-1 bg-[#1C1C1E] text-white h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors">
                  <Check size={16} /> Approve Runner
                </button>
                <button onClick={() => handleReject(app.id)}
                  className="px-5 bg-white border border-[#E5E5EA] text-[#8E8E93] h-11 rounded-xl text-[13px] font-bold flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <X size={16} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
