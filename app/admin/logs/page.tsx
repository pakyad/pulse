"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const TYPE_STYLES: Record<string, string> = {
  PRICE_BLOCK:      'bg-red-50 text-red-500',
  ADJUDICATION:     'bg-emerald-50 text-emerald-600',
  SUSPENSION:       'bg-slate-900 text-white',
  POLICY_UPDATE:    'bg-blue-50 text-blue-500',
  AUTO_COMPLETION:  'bg-purple-50 text-purple-600',
  HANDSHAKE_COMPLETED: 'bg-cyan-50 text-cyan-600',
  HOLD_FOR_REVISION: 'bg-amber-50 text-amber-600',
  WARNING_ISSUED:   'bg-orange-50 text-orange-600',
  PERMANENT_DELETE: 'bg-red-900 text-white',
};

const FILTER_TYPES = ['ALL', 'PRICE_BLOCK', 'ADJUDICATION', 'SUSPENSION', 'WARNING_ISSUED', 'POLICY_UPDATE'];

export default function LogsPage() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');

  useEffect(() => {
    const q = query(collection(db, 'governance_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400  mb-1">Audit Trail</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Activity Logs</h1>
      </div>

      {/* Sticky Filter Pills */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] -mx-8 px-8 py-3">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 w-fit">
          {FILTER_TYPES.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 h-8 rounded-lg text-[11px] font-bold transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Action</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Item ID</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400 ">Details</th>
              <th className="px-6 py-4 text-[9px] font-semibold text-slate-400  text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center">
                <Loader2 className="animate-spin text-slate-300 mx-auto" size={24} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center">
                <p className="text-[13px] font-bold text-slate-300">No activity recorded yet</p>
              </td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold ${
                    TYPE_STYLES[log.type] || 'bg-slate-100 text-slate-400'
                  }`}>
                    {log.type || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <code className="text-[11px] font-bold text-slate-400">
                    #{log.target_id?.substring(0, 8).toUpperCase() || '—'}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[13px] font-medium text-slate-600">{log.details || '—'}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-[11px] font-bold text-slate-300 ">
                    {log.timestamp?.toMillis
                      ? new Date(log.timestamp.toMillis()).toLocaleString()
                      : 'Just now'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
