'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, Loader2, ArrowRight } from 'lucide-react';

export default function RunnerOnboarding() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    studentId: '',
    whatsapp: '',
    transport: 'Walking',
    location: 'Main Campus',
    bankName: '',
    accountNumber: ''
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const BANKS = ['Maybank', 'CIMB', 'Bank Islam', 'RHB', 'Public Bank', 'Hong Leong', 'Other'];
  const TRANSPORT = ['Walking', 'Motor', 'Car'];
  const LOCATIONS = ['Main Campus', 'Residensi RAH'];

  const canSubmit = form.studentId.trim() && form.whatsapp.trim() && form.bankName && form.accountNumber.trim();

  const handleSubmit = async () => {
    if (!auth.currentUser || !canSubmit) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        runner_status: 'pending',
        runner_data: form
      });
      router.push('/run'); // redirect back to run page which will show pending
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-32">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-[14px] font-bold tracking-tight">Apply to be a Runner</p>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Let's get you set up.</h1>
          <p className="text-[13px] font-medium text-slate-400">Fill in your details below to start earning on campus.</p>
        </div>

        {/* ── CARD 1: CONTACT INFO ── */}
        <section className="bg-slate-50 border border-slate-100/80 p-6 rounded-[24px] space-y-5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-cyan-100/50 text-cyan-600 flex items-center justify-center font-bold text-[14px]">1</div>
             <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">Who are you?</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 ml-1">Student ID</label>
              <input type="text" placeholder="e.g. 52214112345" value={form.studentId} onChange={e => update('studentId', e.target.value)}
                className="w-full h-14 px-5 bg-white border border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:border-cyan-300 transition-colors shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 ml-1">WhatsApp Number</label>
              <input type="tel" placeholder="e.g. 0123456789" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
                className="w-full h-14 px-5 bg-white border border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:border-cyan-300 transition-colors shadow-sm" />
            </div>
          </div>
        </section>

        {/* ── CARD 2: DELIVERY STYLE ── */}
        <section className="bg-slate-50 border border-slate-100/80 p-6 rounded-[24px] space-y-5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100/50 text-indigo-600 flex items-center justify-center font-bold text-[14px]">2</div>
             <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">How do you deliver?</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-slate-700 ml-1">Transport</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT.map(t => (
                  <button key={t} onClick={() => update('transport', t)}
                    className={`h-12 px-5 rounded-[16px] text-[13px] font-semibold transition-all active:scale-95 border ${form.transport === t ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-[13px] font-medium text-slate-700 ml-1">Where do you hang out mostly?</label>
              <div className="flex flex-col gap-2">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => update('location', loc)}
                    className={`h-14 px-5 rounded-[16px] text-[14px] font-semibold transition-all active:scale-95 flex items-center justify-between border ${form.location === loc ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                    {loc}
                    {form.location === loc && <div className="w-2 h-2 rounded-full bg-slate-900" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 3: PAYMENT ── */}
        <section className="bg-slate-50 border border-slate-100/80 p-6 rounded-[24px] space-y-5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-violet-100/50 text-violet-600 flex items-center justify-center font-bold text-[14px]">3</div>
             <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">Where do we send your money?</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 ml-1">Bank Name</label>
              <div className="relative">
                <select value={form.bankName} onChange={e => update('bankName', e.target.value)}
                  className="w-full h-14 px-5 bg-white border border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:border-violet-300 transition-colors appearance-none shadow-sm">
                  <option value="" disabled>Select your bank...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft size={16} className="-rotate-90" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 ml-1">Account Number</label>
              <input type="number" placeholder="e.g. 16223456789" value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)}
                className="w-full h-14 px-5 bg-white border border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:border-violet-300 transition-colors shadow-sm" />
            </div>
          </div>
        </section>

        {/* ── SUBMIT BUTTON ── */}
        <div className="pt-4 pb-12">
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className={`w-full h-16 rounded-[20px] flex items-center justify-center gap-2 font-semibold text-[15px] transition-all ${canSubmit ? 'bg-slate-900 text-white active:scale-95 shadow-md hover:bg-slate-800' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Submit Application'}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </div>
      </div>

    </main>
  );
}
