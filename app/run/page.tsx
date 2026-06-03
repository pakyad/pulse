'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ChevronLeft, X, Loader2, ChevronRight, ArrowRight } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';

const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-slate-900 tracking-tight ${className}`}>{children}</h2>
);
const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>{children}</p>
);

// ── VOXEL ICONS ──
const VoxelFood = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="4" y="14" width="16" height="4" fill="currentColor" rx="1" /><rect x="6" y="8" width="4" height="6" fill="currentColor" opacity="0.8" rx="1" /><rect x="12" y="6" width="6" height="8" fill="currentColor" opacity="0.6" rx="1" /></svg>
);
const VoxelLogistics = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="10" width="16" height="8" fill="currentColor" rx="1" /><rect x="14" y="6" width="8" height="12" fill="currentColor" opacity="0.6" rx="1" /><rect x="4" y="18" width="4" height="2" fill="currentColor" rx="0.5" /><rect x="12" y="18" width="4" height="2" fill="currentColor" rx="0.5" /></svg>
);
const VoxelBooks = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="4" y="4" width="4" height="16" fill="currentColor" rx="1" /><rect x="10" y="4" width="4" height="16" fill="currentColor" opacity="0.8" rx="1" /><rect x="16" y="4" width="4" height="16" fill="currentColor" opacity="0.6" rx="1" /></svg>
);
const VoxelErrands = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="8" y="4" width="8" height="8" fill="currentColor" rx="1" /><rect x="4" y="14" width="16" height="6" fill="currentColor" opacity="0.6" rx="1" /></svg>
);

// ── CHIP SELECTOR ──
const ChipRow = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)}
        className={`h-10 px-4 rounded-2xl text-[13px] font-bold border transition-all active:scale-95 ${value === opt ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-[#94a3b8] border-slate-100'}`}>
        {opt}
      </button>
    ))}
  </div>
);

// ── FIELD INPUT ──
const Field = ({ label, placeholder, value, onChange, multiline = false }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">{label}</label>
    {multiline
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
          className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 placeholder:text-slate-300 resize-none transition-all" />
      : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[14px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 placeholder:text-slate-300 transition-all" />
    }
  </div>
);

const UNIKL_CAFES = ['Cafe Block A', 'Starbucks MIIT', 'West Wing Cafeteria'];

const SERVICES = [
  { id: 'food',     label: 'Food & Cravings',  icon: VoxelFood,      desc: 'Cafe Block A, Starbucks, West Wing', accent: 'text-amber-600',  iconBg: 'bg-amber-100',
    steps: [{ title: 'Source',     desc: 'Choose your cafe or canteen' },
            { title: 'Order List', desc: 'Tell us what you want'       },
            { title: 'Schedule',   desc: 'When do you need it?'        },
            { title: 'Meet Point', desc: 'Where should we find you?'   }] },
  { id: 'parcels',  label: 'Parcel & Mail',     icon: VoxelLogistics, desc: 'Shopee, Lazada, Mail',               accent: 'text-slate-600',  iconBg: 'bg-slate-100',
    steps: [{ title: 'Item Type',  desc: 'What type of parcel is it?'  },
            { title: 'Size',       desc: 'How big is the package?'     },
            { title: 'Pickup',     desc: 'Where is the parcel now?'    },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' }] },
  { id: 'academic', label: 'Academic Print',    icon: VoxelBooks,     desc: 'UniStore, Library Hub',              accent: 'text-indigo-600', iconBg: 'bg-indigo-100',
    steps: [{ title: 'Hub',        desc: 'Which printing hub?'         },
            { title: 'Specs',      desc: 'Color and paper preferences' },
            { title: 'Document',   desc: 'Describe what to print'      },
            { title: 'Destination',desc: 'Where should we deliver it?' }] },
  { id: 'errands',  label: 'Custom Tasks',      icon: VoxelErrands,   desc: 'Flexible errands & requests',        accent: 'text-purple-600', iconBg: 'bg-purple-100',
    steps: [{ title: 'Task Brief', desc: 'Describe your task in detail'},
            { title: 'Duration',   desc: 'How long might it take?'     },
            { title: 'Budget',     desc: 'Any petty cash needed?'      },
            { title: 'Review',     desc: 'Confirm your request'        }] },
];

export default function RunModule() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [activeService, setActiveService] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    // food
    source: '', items: '', schedule: '', meetPoint: '',
    // parcels
    parcelType: '', parcelSize: '', pickupNode: '', dropOff: '',
    // academic
    hub: '', specs_color: '', specs_side: '', docDesc: '', destination: '',
    // errands
    errandBrief: '', errandDuration: '', errandBudget: '',
  });

  const setF = (key: string, val: string) => setForm((p: any) => ({ ...p, [key]: val }));

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
    });
    return () => unsub();
  }, []);

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    setStatusError(null);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { is_online: !profile?.is_online, last_active: serverTimestamp() });
    } catch {
      setStatusError('Could not update status. Check your connection.');
      setTimeout(() => setStatusError(null), 3000);
    }
  };

  const handleFinalizeRequest = async () => {
    if (!auth.currentUser) return router.push('/auth');
    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, 'createRunDirective');
      const res: any = await fn({
        serviceId: activeService.id,
        label: activeService.label,
        source: form.source || form.hub || form.pickupNode || activeService.desc.split(',')[0],
        dest: form.meetPoint || form.dropOff || form.destination || 'Campus',
        fee: 4.50,
        items: form.items || form.docDesc || form.errandBrief || 'Delivery Request',
        type: activeService.id.toUpperCase(),
        zone: 'ALL',
      });
      router.push(`/orders/success?id=${res.data.orderId}`);
    } catch {
      setSubmitError('Could not submit request. Check your connection and try again.');
      setTimeout(() => setSubmitError(null), 4000);
    } finally { setSubmitting(false); }
  };

  // ── STEP CONTENT RENDERER ──
  const renderStep = () => {
    const id = activeService?.id;
    switch (id) {
      case 'food':
        if (currentStep === 0) return (
          <div className="space-y-3">
            {UNIKL_CAFES.map(cafe => (
              <button key={cafe} onClick={() => { setF('source', cafe); setCurrentStep(1); }}
                className={`w-full h-[72px] px-6 rounded-[22px] flex items-center justify-between border-2 transition-all active:scale-95 ${form.source === cafe ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-900 border-transparent'}`}>
                <span className="text-[15px] font-bold">{cafe}</span>
                <ChevronRight size={18} className={form.source === cafe ? 'text-white/40' : 'text-slate-200'} />
              </button>
            ))}
          </div>
        );
        if (currentStep === 1) return <Field label="What do you want?" placeholder="e.g. Nasi Lemak + Teh Tarik, no sugar" value={form.items} onChange={(v: string) => setF('items', v)} multiline />;
        if (currentStep === 2) return <ChipRow options={['ASAP', 'In 30 min', 'In 1 hour']} value={form.schedule} onChange={v => setF('schedule', v)} />;
        if (currentStep === 3) return <Field label="Where should the runner find you?" placeholder="e.g. Block K, Level 3, Room 304" value={form.meetPoint} onChange={(v: string) => setF('meetPoint', v)} />;
        break;

      case 'parcels':
        if (currentStep === 0) return <ChipRow options={['Shopee', 'Lazada', 'J&T Mail', 'Other']} value={form.parcelType} onChange={v => setF('parcelType', v)} />;
        if (currentStep === 1) return <ChipRow options={['Small (fits in bag)', 'Medium (shoebox)', 'Large (bulky)']} value={form.parcelSize} onChange={v => setF('parcelSize', v)} />;
        if (currentStep === 2) return <Field label="Where is the parcel now?" placeholder="e.g. Guard post, Block N lobby" value={form.pickupNode} onChange={(v: string) => setF('pickupNode', v)} />;
        if (currentStep === 3) return <Field label="Where should we deliver it?" placeholder="e.g. Block K, Level 2, Lecture Hall" value={form.dropOff} onChange={(v: string) => setF('dropOff', v)} />;
        break;

      case 'academic':
        if (currentStep === 0) return <ChipRow options={['UniStore', 'Library Hub']} value={form.hub} onChange={v => setF('hub', v)} />;
        if (currentStep === 1) return (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Print Type</p>
              <ChipRow options={['Black & White', 'Color']} value={form.specs_color} onChange={v => setF('specs_color', v)} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Sides</p>
              <ChipRow options={['Single Sided', 'Double Sided']} value={form.specs_side} onChange={v => setF('specs_side', v)} />
            </div>
          </div>
        );
        if (currentStep === 2) return <Field label="Document description" placeholder="e.g. FYP report, 50 pages, A4, stapled" value={form.docDesc} onChange={(v: string) => setF('docDesc', v)} multiline />;
        if (currentStep === 3) return <Field label="Where to deliver the printout?" placeholder="e.g. Lab 3.1, Block N Level 3" value={form.destination} onChange={(v: string) => setF('destination', v)} />;
        break;

      case 'errands':
        if (currentStep === 0) return <Field label="Describe your task" placeholder="e.g. Please buy a pen from the bookshop and bring it to me" value={form.errandBrief} onChange={(v: string) => setF('errandBrief', v)} multiline />;
        if (currentStep === 1) return <ChipRow options={['Under 15 min', 'Under 30 min', 'Under 1 hour']} value={form.errandDuration} onChange={v => setF('errandDuration', v)} />;
        if (currentStep === 2) return (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest ml-1">Petty Cash (RM)</label>
            <input type="number" min="0" step="0.50" value={form.errandBudget} onChange={e => setF('errandBudget', e.target.value)} placeholder="0.00"
              className="w-full h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[20px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" />
            <p className="text-[11px] text-[#94a3b8] font-medium pl-1">Enter 0 if no cash is needed for the task.</p>
          </div>
        );
        if (currentStep === 3) return (
          <div className="space-y-4">
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Your Request Summary</p>
            {[
              { label: 'Task', value: form.errandBrief || '—' },
              { label: 'Duration', value: form.errandDuration || '—' },
              { label: 'Budget', value: form.errandBudget ? `RM ${Number(form.errandBudget).toFixed(2)}` : 'No cash needed' },
            ].map(r => (
              <div key={r.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50">
                <span className="text-[12px] font-bold text-[#94a3b8] shrink-0">{r.label}</span>
                <span className="text-[13px] font-bold text-slate-900 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        );
        break;
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-[14px] font-bold tracking-tight">Deliveries</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
      </nav>

      <div className="pt-28 px-6 space-y-12">

        {/* ── Error toasts ── */}
        {statusError && (
          <div className="fixed top-20 left-6 right-6 z-[200] bg-red-500 text-white px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md text-center">{statusError}</div>
        )}
        {submitError && (
          <div className="fixed top-20 left-6 right-6 z-[200] bg-red-500 text-white px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md text-center">{submitError}</div>
        )}

        {/* ── RUNNER DASHBOARD (verified runners only) ── */}
        {profile?.is_verified_runner && (
          <div className="space-y-6">
            <div className="px-1">
              <Heading>Runner Dashboard</Heading>
              <Subtext>Manage your active missions and earnings</Subtext>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-5">
                <div className={`w-1.5 h-12 rounded-full transition-all ${profile?.is_online ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`} />
                <div>
                  <p className="text-[28px] font-bold text-slate-900 tracking-tighter leading-none">RM {(profile?.balance || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-[#94a3b8] font-bold mt-1 lowercase tracking-tight">today's earnings</p>
                </div>
              </div>
              <button onClick={toggleStatus}
                className={`h-11 px-5 rounded-2xl text-[12px] font-bold border transition-all flex items-center gap-2 ${profile?.is_online ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}`}>
                {profile?.is_online && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                <span className="lowercase">{profile?.is_online ? 'online' : 'offline'}</span>
              </button>
            </div>
            <div className="space-y-4 px-1">
              {[
                { label: 'Available Jobs',  sub: 'browse active missions', path: '/run/missions' },
                { label: 'Delivery Hub',    sub: 'open terminal tools',   path: '/run/terminal' },
              ].map(item => (
                <button key={item.path} onClick={() => router.push(item.path)} className="w-full flex items-center justify-between group py-2">
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors tracking-tight">{item.label}</p>
                    <p className="text-[11px] text-[#94a3b8] font-medium lowercase">{item.sub}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── REQUEST DELIVERY ── */}
        <div className="space-y-6">
          <div className="px-1">
            <Heading>Request Delivery</Heading>
            <Subtext>Get help with food, parcels, or custom tasks on campus</Subtext>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setActiveService(s); setCurrentStep(0); }}
                className="w-full h-[96px] px-6 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className={s.accent} size={28} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-bold text-slate-900 tracking-tight">{s.label}</h4>
                    <p className="text-[12px] text-[#94a3b8] font-medium mt-0.5">{s.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FULL-SCREEN WIZARD ── */}
      <AnimatePresence>
        {activeService && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-200 bg-white flex flex-col">

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                className="h-full bg-slate-900 rounded-r-full" />
            </div>

            {/* Wizard nav */}
            <nav className="px-6 pt-10 pb-5 flex items-center justify-between border-b border-slate-50">
              <button onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : setActiveService(null)}
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                <ChevronLeft size={18} />
              </button>
              <p className="text-[14px] font-bold text-slate-900 tracking-tight">{activeService.label}</p>
              <button onClick={() => setActiveService(null)} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                <X size={18} />
              </button>
            </nav>

            {/* Step content */}
            <div className="flex-1 px-6 pt-8 pb-4 overflow-y-auto">
              <div className="space-y-2 mb-8">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Step {currentStep + 1} of 4</p>
                <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{activeService.steps[currentStep].title}</h2>
                <Subtext>{activeService.steps[currentStep].desc}</Subtext>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={`${activeService.id}-${currentStep}`}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  className="space-y-4">
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pb-12 pt-4 bg-white border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-between px-1">
                <Subtext>Estimated Delivery Fee</Subtext>
                <p className="text-[20px] font-bold text-slate-900">RM 4.50</p>
              </div>
              <button onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleFinalizeRequest()}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md shadow-slate-900/10">
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (currentStep === 3 ? 'Confirm Order' : 'Continue')}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
    </main>
  );
}
