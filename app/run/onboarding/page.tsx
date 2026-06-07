'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, Loader2, ArrowRight, X } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

export default function RunnerOnboarding() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    transport: 'Walking',
    location: 'Main Campus',
    schedule: 'Flexible',
    capacity: 'Light (Food, Docs)',
    bankName: '',
    accountNumber: ''
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const BANKS = ['Maybank', 'CIMB', 'Bank Islam', 'RHB', 'Public Bank', 'Hong Leong', 'Other'];
  const TRANSPORT = ['Walking', 'Motor', 'Car'];
  const LOCATIONS = ['Main Campus', 'Residensi RAH'];
  const SCHEDULES = ['Flexible', 'Weekdays', 'Weekends/Nights'];
  const CAPACITIES = ['Light (Food, Docs)', 'Medium (Parcels)', 'Heavy (Boxes)'];

  const canSubmit = form.bankName && form.accountNumber.trim();

  const handleSubmit = async () => {
    if (!auth.currentUser || !canSubmit) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        runner_status: 'pending',
        runner_data: form
      });
      router.push('/run'); 
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-gray-900 antialiased pb-32 font-sans">
      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton fallback="/run" />
          <p className="text-xl font-bold tracking-tight">Onboarding</p>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-6 max-w-md mx-auto">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Let's get you set up.</h1>
          <p className="text-sm text-gray-400">Fill in your details below to start earning on campus.</p>
        </div>

        {/*  CARD 1: DELIVERY STYLE  */}
        <section className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[14px]">1</div>
             <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">How do you deliver?</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Transport</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT.map(t => (
                  <button key={t} onClick={() => update('transport', t)}
                    className={`h-11 px-5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${form.transport === t ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Location Hub</label>
              <div className="flex flex-col gap-2">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => update('location', loc)}
                    className={`h-14 px-5 rounded-2xl text-[14px] font-bold transition-all active:scale-95 flex items-center justify-between border ${form.location === loc ? 'bg-gray-50 border-gray-900 text-gray-900 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                    {loc}
                    {form.location === loc && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/*  CARD 2: CAPACITY & SCHEDULE  */}
        <section className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[14px]">2</div>
             <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Availability & Capacity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preferred Schedule</label>
              <div className="flex flex-wrap gap-2">
                {SCHEDULES.map(s => (
                  <button key={s} onClick={() => update('schedule', s)}
                    className={`h-11 px-5 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${form.schedule === s ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Weight Capacity</label>
              <div className="flex flex-col gap-2">
                {CAPACITIES.map(cap => (
                  <button key={cap} onClick={() => update('capacity', cap)}
                    className={`h-14 px-5 rounded-2xl text-[14px] font-bold transition-all active:scale-95 flex items-center justify-between border ${form.capacity === cap ? 'bg-gray-50 border-gray-900 text-gray-900 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}>
                    {cap}
                    {form.capacity === cap && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/*  CARD 3: PAYMENT  */}
        <section className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[14px]">3</div>
             <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Payout Terminal</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
              <div className="relative">
                <select value={form.bankName} onChange={e => update('bankName', e.target.value)}
                  className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 outline-none focus:border-gray-900 transition-colors appearance-none shadow-sm">
                  <option value="" disabled>Select partner bank...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ChevronLeft size={16} className="-rotate-90" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
              <input type="number" placeholder="Account ID" value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)}
                className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold text-gray-900 outline-none focus:border-gray-900 transition-colors shadow-sm" />
            </div>
          </div>
        </section>

        {/*  SUBMIT BUTTON  */}
        <div className="pt-4 pb-12">
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className={`w-full h-16 rounded-full flex items-center justify-center gap-3 font-bold text-[15px] transition-all ${canSubmit ? 'bg-gray-900 text-white active:scale-95 shadow-lg' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}>
            {submitting ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                <span>Submit Application</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

    </main>
  );
}
