'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ChevronLeft, X, Loader2, ChevronRight, ArrowRight, Package, Map, History } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

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

// Components moved inside RunModule for theming

const UNIKL_CAFES = ['Cafe Block A', 'Starbucks MIIT', 'West Wing Cafeteria'];

const SERVICES = [
  { id: 'food',     label: 'Food & Cravings',  icon: VoxelFood,      desc: 'Cafe Block A, Starbucks, West Wing', accent: 'text-orange-950',  iconBg: 'bg-orange-50', circleBg: 'bg-orange-200/60', selectedStyle: 'bg-orange-50 border-orange-300 text-orange-950', btnStyle: 'bg-orange-950', fee: 4.50,
    steps: [{ title: 'Source',     desc: 'Choose your cafe or canteen' },
            { title: 'Order List', desc: 'Tell us what you want'       },
            { title: 'Schedule',   desc: 'When do you need it?'        },
            { title: 'Meet Point', desc: 'Where should we find you?'   }] },
  { id: 'parcels',  label: 'Parcel & Mail',     icon: VoxelLogistics, desc: 'Shopee, Lazada, Mail',               accent: 'text-cyan-950',  iconBg: 'bg-cyan-50', circleBg: 'bg-cyan-200/70', selectedStyle: 'bg-cyan-50 border-cyan-300 text-cyan-950', btnStyle: 'bg-cyan-950', fee: 5.00,
    steps: [{ title: 'Item Type',  desc: 'What type of parcel is it?'  },
            { title: 'Size',       desc: 'How big is the package?'     },
            { title: 'Pickup',     desc: 'Where is the parcel now?'    },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' }] },
  { id: 'academic', label: 'Academic Print',    icon: VoxelBooks,     desc: 'UniStore, Library Hub',              accent: 'text-violet-950', iconBg: 'bg-violet-50', circleBg: 'bg-violet-200/60', selectedStyle: 'bg-violet-50 border-violet-300 text-violet-950', btnStyle: 'bg-violet-950', fee: 3.50,
    steps: [{ title: 'Hub',        desc: 'Which printing hub?'         },
            { title: 'Specs',      desc: 'Color and paper preferences' },
            { title: 'Document',   desc: 'Describe what to print'      },
            { title: 'Destination',desc: 'Where should we deliver it?' }] },
  { id: 'errands',  label: 'Custom Tasks',      icon: VoxelErrands,   desc: 'Flexible errands & requests',        accent: 'text-rose-950', iconBg: 'bg-rose-50', circleBg: 'bg-rose-200/60', selectedStyle: 'bg-rose-50 border-rose-300 text-rose-950', btnStyle: 'bg-rose-950', fee: 6.00,
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
  const [customFee, setCustomFee] = useState<string>('');
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

  // ── THEMED CHIP SELECTOR ──
  const ChipRow = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => {
    const activeClass = activeService?.selectedStyle ? `${activeService.selectedStyle} shadow-sm border-[1.5px]` : 'bg-slate-900 text-white shadow-md border-[1.5px] border-slate-900';
    const inactiveClass = `bg-white text-slate-500 border-[1.5px] border-slate-100 hover:border-slate-200`;
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`h-11 px-5 rounded-2xl text-[13px] font-bold transition-all active:scale-95 ${value === opt ? activeClass : inactiveClass}`}>
            {opt}
          </button>
        ))}
      </div>
    );
  };

  // ── STANDARD FIELD INPUT ──
  const Field = ({ label, placeholder, value, onChange, multiline = false }: any) => {
    return (
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 text-slate-400">{label}</label>
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
              className="w-full px-5 py-4 bg-white border-[1.5px] border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 placeholder:text-slate-300 resize-none transition-all shadow-sm" />
          : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              className="w-full h-14 px-5 bg-white border-[1.5px] border-slate-100 rounded-2xl text-[14px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 placeholder:text-slate-300 transition-all shadow-sm" />
        }
      </div>
    );
  };

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

  const canAdvanceStep = () => {
    if (!activeService) return false;
    const s = activeService.id;
    if (s === 'food') {
      if (currentStep === 0 && !form.source) return false;
      if (currentStep === 1 && !form.items) return false;
      if (currentStep === 2 && !form.schedule) return false;
      if (currentStep === 3 && !form.meetPoint) return false;
    }
    if (s === 'parcels') {
      if (currentStep === 0 && !form.parcelType) return false;
      if (currentStep === 1 && !form.parcelSize) return false;
      if (currentStep === 2 && !form.pickupNode) return false;
      if (currentStep === 3 && !form.dropOff) return false;
    }
    if (s === 'academic') {
      if (currentStep === 0 && !form.hub) return false;
      if (currentStep === 1 && (!form.specs_color || !form.specs_side)) return false;
      if (currentStep === 2 && !form.docDesc) return false;
      if (currentStep === 3 && !form.destination) return false;
    }
    if (s === 'errands') {
      if (currentStep === 0 && !form.errandBrief) return false;
      if (currentStep === 1 && !form.errandDuration) return false;
      if (currentStep === 2 && !form.errandBudget) return false;
    }
    return true;
  };

  const handleFinalizeRequest = async () => {
    if (!auth.currentUser) return router.push('/auth');
    setSubmitting(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        buyer_id: auth.currentUser.uid,
        buyer_name: profile?.full_name || 'Student',
        title: activeService.label,
        type: activeService.id.toUpperCase(),
        pickup_location: form.source || form.hub || form.pickupNode || activeService.desc.split(',')[0],
        drop_off_location: form.meetPoint || form.dropOff || form.destination || 'Campus',
        total_price: parseFloat(customFee) || activeService.fee || 4.50,
        items_summary: form.items || form.docDesc || form.errandBrief || 'Delivery Request',
        status: 'PENDING_RUNNER',
        created_at: serverTimestamp()
      });
      router.push(`/orders/success?id=${orderRef.id}`);
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
            {UNIKL_CAFES.map(cafe => {
              const isSelected = form.source === cafe;
              const activeClass = activeService?.selectedStyle ? `${activeService.selectedStyle} shadow-sm border-[1.5px]` : 'bg-slate-900 text-white border-[1.5px] border-slate-900 shadow-md';
              const inactiveClass = `bg-white text-slate-900 border-[1.5px] border-slate-100 hover:border-slate-200`;
              return (
                <button key={cafe} onClick={() => { setF('source', cafe); setCurrentStep(1); }}
                  className={`w-full h-[72px] px-6 rounded-[22px] flex items-center justify-between transition-all active:scale-95 ${isSelected ? activeClass : inactiveClass}`}>
                  <span className="text-[15px] font-bold">{cafe}</span>
                  <ChevronRight size={18} className={isSelected ? 'opacity-40' : 'text-slate-300'} />
                </button>
              );
            })}
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
          <div className="fixed top-20 left-6 right-6 z-200 bg-red-500 text-white px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md text-center">{statusError}</div>
        )}
        {submitError && (
          <div className="fixed top-20 left-6 right-6 z-200 bg-red-500 text-white px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md text-center">{submitError}</div>
        )}

        {/* ── RUNNER DASHBOARD (verified runners only) ── */}
        {/* ── RUNNER DASHBOARD (verified runners only) ── */}
        {profile?.is_verified_runner ? (
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
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Delivery Hub Card */}
              <button 
                onClick={() => router.push('/run/terminal')} 
                className={`w-full flex flex-col items-start gap-4 p-5 rounded-[24px] transition-all active:scale-95 shadow-sm ${profile?.is_online ? 'bg-cyan-50 text-cyan-950' : 'bg-slate-50 text-slate-700'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${profile?.is_online ? 'bg-cyan-200/70 text-cyan-950' : 'bg-slate-200 text-slate-500'}`}>
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <p className="text-[14px] font-bold tracking-tight">Delivery Hub</p>
              </button>

              {/* History Card */}
              <button 
                onClick={() => router.push('/run/history')} 
                className="w-full flex flex-col items-start gap-4 p-5 rounded-[24px] bg-violet-50 transition-all active:scale-95 text-violet-950 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-200/60 text-violet-950">
                  <History size={20} strokeWidth={2.5} />
                </div>
                <p className="text-[14px] font-bold tracking-tight truncate">Mission History</p>
              </button>
            </div>
          </div>
        ) : profile?.runner_status === 'pending' ? (
           <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div>
                <Heading className="text-amber-900">Application Pending</Heading>
                <Subtext className="text-amber-700/80">Your runner request is under review</Subtext>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin" />
              </div>
           </div>
        ) : (
           <button onClick={() => router.push('/run/onboarding')} className="w-full bg-slate-900 p-6 rounded-2xl flex items-center justify-between group active:scale-95 transition-all shadow-md shadow-slate-900/10">
              <div className="text-left">
                <Heading className="text-white">Become a Runner</Heading>
                <Subtext className="text-slate-300">Earn up to RM 200/week completing missions</Subtext>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                <ArrowRight size={20} />
              </div>
           </button>
        )}

        {/* ── REQUEST DELIVERY ── */}
        <div className="space-y-4">
          <div className="px-1">
            <Heading>Request Delivery</Heading>
            <Subtext>Get help with food, parcels, or custom tasks on campus</Subtext>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { setActiveService(s); setCurrentStep(0); setCustomFee(s.fee.toFixed(2)); }}
                className={`w-full flex flex-col items-start gap-4 p-5 rounded-[24px] transition-all active:scale-95 shadow-sm ${s.iconBg} ${s.accent}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.circleBg}`}>
                  <s.icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left w-full">
                  <p className="text-[14px] font-bold tracking-tight leading-tight">{s.label}</p>
                  <p className="text-[11px] font-medium mt-1 line-clamp-2 leading-relaxed opacity-70">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FULL-SCREEN WIZARD ── */}
      <AnimatePresence>
        {activeService && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-200 flex flex-col bg-slate-50">

            {/* Wizard nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-slate-50/80 backdrop-blur-xl border-b-[0.5px] border-slate-200/50">
               <div className="flex items-center gap-2">
                 <button onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : setActiveService(null)}
                   className="w-10 h-10 flex items-center justify-start text-slate-400 hover:text-slate-900 active:scale-95 transition-all">
                   <ChevronLeft size={24} />
                 </button>
                 <p className="text-[15px] font-bold tracking-tight text-slate-900">{activeService.label}</p>
               </div>
               <button onClick={() => setActiveService(null)} className="w-10 h-10 flex items-center justify-end text-slate-400 hover:text-slate-900 active:scale-95 transition-all">
                 <X size={24} />
               </button>
            </nav>

            {/* Progress bar positioned right below the fixed nav */}
            <div className="fixed top-[88px] left-0 right-0 h-1 bg-slate-200/50 z-50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                className="h-full rounded-r-full bg-blue-600" />
            </div>

            {/* Step content */}
            <div className="flex-1 px-8 pt-32 pb-4 overflow-y-auto">
              <div className="space-y-1 mb-8">
                <h2 className="text-[28px] font-bold tracking-tight leading-tight text-slate-900">{activeService.steps[currentStep].title}</h2>
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
            <div className="px-8 pb-10 pt-6 bg-slate-50 border-t border-slate-200/50 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Delivery Reward</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Recommended: RM {activeService.fee.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 border-b-2 border-slate-200 focus-within:border-blue-600 transition-colors pb-1">
                  <span className="text-[18px] font-bold text-slate-400">RM</span>
                  <input 
                    type="number"
                    value={customFee}
                    onChange={(e) => setCustomFee(e.target.value)}
                    className="w-20 text-right text-[26px] font-black text-slate-900 bg-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleFinalizeRequest()}
                disabled={submitting || !canAdvanceStep()}
                className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:grayscale">
                {submitting ? <Loader2 className="animate-spin" size={22} /> : (currentStep === 3 ? 'Confirm Order' : 'Continue')}
                {!submitting && <ArrowRight size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </main>
  );
}
