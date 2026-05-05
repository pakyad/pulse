'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { 
  ChevronLeft, 
  Bell, 
  X,
  Loader2,
  Navigation,
  MapPin,
  Camera,
  Package,
  ChevronDown,
  ArrowRight,
  Utensils,
  Box,
  Printer,
  Zap,
  ChevronRight,
  Clock,
  AlertCircle,
  FileText,
  Weight,
  Layers,
  ShieldCheck,
  CreditCard,
  Map,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import CarrierTerminal from './terminal/page';

// ── VOXEL ICON SYNCHRONIZATION ──
const VoxelFood = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="14" width="16" height="4" fill="currentColor" rx="1" />
    <rect x="6" y="8" width="4" height="6" fill="currentColor" opacity="0.8" rx="1" />
    <rect x="12" y="6" width="6" height="8" fill="currentColor" opacity="0.6" rx="1" />
  </svg>
);

const VoxelLogistics = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="10" width="16" height="8" fill="currentColor" rx="1" />
    <rect x="14" y="6" width="8" height="12" fill="currentColor" opacity="0.6" rx="1" />
    <rect x="4" y="18" width="4" height="2" fill="currentColor" rx="0.5" />
    <rect x="12" y="18" width="4" height="2" fill="currentColor" rx="0.5" />
  </svg>
);

const VoxelBooks = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="4" height="16" fill="currentColor" rx="1" />
    <rect x="10" y="4" width="4" height="16" fill="currentColor" opacity="0.8" rx="1" />
    <rect x="16" y="4" width="4" height="16" fill="currentColor" opacity="0.6" rx="1" />
  </svg>
);

const VoxelErrands = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="4" width="8" height="8" fill="currentColor" rx="1" />
    <rect x="4" y="14" width="16" height="6" fill="currentColor" opacity="0.6" rx="1" />
  </svg>
);

// ── DATA DEFINITIONS ──
const SERVICES = [
  { 
    id: 'food', 
    label: 'Food & Cravings', 
    icon: VoxelFood, 
    desc: 'Cafe Block A, Starbucks, West Wing',
    accent: 'text-amber-600',
    steps: [
      { title: "Store Selection", desc: "Choose your dining source" },
      { title: "Item Input", desc: "List items and estimated cost" },
      { title: "Delivery Window", desc: "Set your arrival protocol" },
      { title: "Hand-off", desc: "Location handshake" }
    ]
  },
  { 
    id: 'parcels', 
    label: 'Parcel & Mail', 
    icon: VoxelLogistics, 
    desc: 'Shopee, Lazada, Personal Mail',
    accent: 'text-slate-600',
    steps: [
      { title: "Parcel Type", desc: "Categorize size and bulk" },
      { title: "Security Check", desc: "Verify collection QR" },
      { title: "Dimension Filter", desc: "Weight & capacity check" },
      { title: "Pickup Point", desc: "Select collection node" }
    ]
  },
  { 
    id: 'academic', 
    label: 'Academic Print', 
    icon: VoxelBooks, 
    desc: 'UniStore, Library East Node',
    accent: 'text-indigo-600',
    steps: [
      { title: "Document Source", desc: "Cloud or link directory" },
      { title: "Spec Selection", desc: "B&W, Color, Binding" },
      { title: "Print Shop", desc: "Select operational node" },
      { title: "Destination", desc: "Lab or Classroom delivery" }
    ]
  },
  { 
    id: 'errands', 
    label: 'Custom Errands', 
    icon: VoxelErrands, 
    desc: 'Flexible directives & tasks',
    accent: 'text-purple-600',
    steps: [
      { title: "Task Description", desc: "Detailed operational prompt" },
      { title: "Estimated Effort", desc: "Time & energy projection" },
      { title: "Material Cost", desc: "Financial upfront protocol" },
      { title: "Risk Disclaimer", desc: "UniKL code compliance" }
    ]
  },
];

const UNIKL_CAFES = [
  { name: "Cafe Block A", status: "Peak Hour", wait: "15m" },
  { name: "Starbucks MIIT", status: "Available", wait: "5m" },
  { name: "West Wing Cafeteria", status: "Available", wait: "10m" },
  { name: "Lobby Kiosk", status: "Closed", wait: "N/A" }
];

// ── REUSABLE UI MODULES ──

const OptionCard = ({ label, sublabel, icon: Icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full h-20 px-6 rounded-[22px] flex items-center justify-between border-2 transition-all ${active ? 'bg-navy text-white border-navy shadow-xl shadow-navy/20' : 'bg-slate-50 text-navy border-transparent'}`}
  >
     <div className="flex items-center gap-4">
        {Icon && <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />}
        <div className="text-left">
           <p className="text-[15px] font-bold tracking-tight">{label}</p>
           {sublabel && <p className={`text-[11px] font-medium ${active ? 'text-white/60' : 'text-slate-400'}`}>{sublabel}</p>}
        </div>
     </div>
     <ChevronRight size={18} className={active ? 'text-white/40' : 'text-slate-200'} />
  </button>
);

const ServiceStrip = ({ label, icon: Icon, desc, onClick, accent, id }: any) => {
  const bgColor = id === 'food' ? 'bg-amber-50/50' : 
                  id === 'parcels' ? 'bg-slate-50/50' : 
                  id === 'academic' ? 'bg-indigo-50/50' : 
                  'bg-purple-50/50';
  
  const iconBg = id === 'food' ? 'bg-amber-100' : 
                 id === 'parcels' ? 'bg-slate-100' : 
                 id === 'academic' ? 'bg-indigo-100' : 
                 'bg-purple-100';

  return (
    <button 
      onClick={onClick}
      className={`w-full h-[92px] px-6 ${bgColor} border border-[#F2F2F7] rounded-[24px] flex items-center justify-between group active:scale-[0.98] transition-all duration-300`}
    >
       <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
             <Icon className={accent} size={28} />
          </div>
          <div className="text-left">
             <h4 className="text-[17px] font-bold text-navy tracking-tight">{label}</h4>
             <p className="text-[12px] text-slate-400 font-medium tracking-tight mt-0.5">{desc}</p>
          </div>
       </div>
       <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#F2F2F7] opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
          <ChevronRight size={18} className="text-navy" />
       </div>
    </button>
  );
};

export default function RunModule() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [status, setStatus] = useState<'loading' | 'verified'>('loading');
    const [activeService, setActiveService] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Deep Form State
    const [form, setForm] = useState<any>({
       source: '',
       items: '',
       budget: '',
       window: 'ASAP',
       handoff: '',
       parcelType: '',
       securityPhoto: null,
       weight: '',
       pickupNode: '',
       docUrl: '',
       printSpecs: [],
       destination: '',
       errandBrief: '',
       errandEffort: '',
       errandCost: ''
    });

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(user => {
            if (user) {
                onSnapshot(doc(db, "users", user.uid), (snap) => {
                  setProfile(snap.data());
                  setStatus('verified');
                });
            } else { setStatus('verified'); }
        });
        return () => unsub();
    }, []);

    const next = () => setCurrentStep(s => s + 1);
    const back = () => { if(currentStep > 0) setCurrentStep(s => s - 1); else setActiveService(null); };

    const handleFinalizeDirective = async () => {
        if (!auth.currentUser) { router.push('/auth'); return; }
        setSubmitting(true);
        try {
            const createRunFn = httpsCallable(functions, 'createRunDirective');
            
            // Map form state to registry format
            const payload = {
                serviceId: activeService.id,
                label: activeService.label,
                source: form.source || activeService.desc.split(',')[0],
                dest: form.destination || form.handoff || form.pickupNode || 'Campus Hub',
                fee: 4.50, // Standardized fee
                items: form.items || form.errandBrief || form.docUrl || 'Standard Logistics Item',
                instructions: form.items || form.errandBrief || 'N/A',
                type: activeService.id.toUpperCase(),
                zone: 'ALL ZONES'
            };

            const result: any = await createRunFn(payload);
            const orderId = result.data.orderId;
            
            setActiveService(null);
            router.push(`/orders/success?id=${orderId}`);
        } catch (e: any) {
            console.error("RUN_DIRECTIVE_FAILED:", e);
            alert(e.message || "Registry update failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading') return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-navy" /></div>;

    if (profile?.is_verified_runner) {
       return <CarrierTerminal />;
    }

    return (
       <main className="min-h-screen bg-white antialiased text-navy overflow-x-hidden">
          
          <nav className="fixed top-0 left-0 right-0 z-[60] px-8 pt-4 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-xl">
             <div className="flex items-center gap-4">
                <button onClick={() => router.push('/home')} className="p-2 -ml-2 text-slate-300 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                <h1 className="text-[14px] font-bold tracking-[0.2em] uppercase opacity-40">Run Terminal</h1>
             </div>
             <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
          </nav>

          <div className="pt-24 px-8 pb-32 space-y-12">
             <div className="space-y-2">
                <h2 className="text-[18px] font-bold tracking-tight text-navy">Logistics Directives</h2>
                <p className="text-[13px] text-slate-400 font-medium leading-relaxed">Initiate a 4-layer verification funnel for specialized task fulfillment.</p>
             </div>

             <div className="space-y-3">
                {SERVICES.map(service => (
                   <ServiceStrip key={service.id} {...service} onClick={() => { setActiveService(service); setCurrentStep(0); }} />
                ))}
             </div>

             <footer className="pt-10">
                <div className="space-y-1">
                   {[
                      { title: "Interested in helping the campus?", content: "Active UniKL MIIT students are eligible to join the Pulse Runner network." },
                      { title: "What are the requirements?", content: "You must be a current student, maintain a 4.5+ star rating." }
                   ].map((item, idx) => (
                      <div key={idx} className="border-b border-[#F2F2F7] last:border-0">
                         <button onClick={() => setIsFAQOpen(isFAQOpen === idx ? null : idx)} className="w-full py-4 flex items-center justify-between group">
                            <h3 className="text-[14px] font-semibold text-slate-500 tracking-tight text-left">{item.title}</h3>
                            <ChevronDown size={14} className={`text-[#8E8E93] transition-transform duration-300 ${isFAQOpen === idx ? 'rotate-180' : ''}`} />
                         </button>
                         <AnimatePresence>
                            {isFAQOpen === idx && (
                               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <p className="pb-6 text-[13px] text-slate-400 leading-relaxed">{item.content}</p>
                                  {idx === 0 && (
                                     <button 
                                        onClick={() => profile?.is_verified_runner ? router.push('/run/terminal') : setIsEnrollmentOpen(true)} 
                                        className="mb-8 px-8 h-14 bg-[#0A0F1E] text-white text-[14px] font-bold rounded-2xl active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-[#0A0F1E]/10"
                                     >
                                        {profile?.is_verified_runner ? (
                                           <>
                                              <Zap size={18} className="text-amber-400 fill-amber-400" />
                                              Open Carrier Terminal
                                           </>
                                        ) : (
                                           'Apply Now'
                                        )}
                                     </button>
                                  )}
                               </motion.div>
                            )}
                         </AnimatePresence>
                      </div>
                   ))}
                </div>
             </footer>
          </div>

          <AnimatePresence>
             {activeService && (
                <motion.div 
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed inset-0 z-[200] bg-white flex flex-col"
                >
                   {/* IKEA PROGRESS BAR */}
                   <div className="absolute top-0 left-0 right-0 h-[12px] bg-slate-50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / 4) * 100}%` }} className="h-full bg-navy transition-all duration-500" />
                   </div>

                   {/* FUNNEL HEADER */}
                   <nav className="px-8 pt-10 pb-6 flex items-center justify-between border-b border-[#F2F2F7]">
                      <div className="flex items-center gap-4">
                         <button onClick={back} className="p-2 -ml-2 text-slate-300 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                         <h2 className="text-[14px] font-bold tracking-[0.2em] uppercase opacity-40">{activeService.label}</h2>
                      </div>
                      <button onClick={() => { setActiveService(null); setCurrentStep(0); }} className="p-2 text-slate-300"><X size={24} /></button>
                   </nav>

                   {/* DYNAMIC FUNNEL RENDERER */}
                   <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                      <div className="space-y-10">
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.1em]">Layer {currentStep + 1} of 4</p>
                            <h3 className="text-[28px] font-bold tracking-tight text-navy leading-[1.1]">{activeService.steps[currentStep].title}</h3>
                            <p className="text-[14px] text-slate-400 font-medium leading-relaxed">{activeService.steps[currentStep].desc}</p>
                         </div>

                         {/* POLYMORPHIC LAYER ENGINE */}
                         <div className="space-y-6">
                            
                            {/* ── FOOD LAYERS ── */}
                            {activeService.id === 'food' && (
                               <>
                                  {currentStep === 0 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {UNIKL_CAFES.map(cafe => (
                                           <OptionCard key={cafe.name} label={cafe.name} sublabel={cafe.status === 'Peak Hour' ? `Warning: ${cafe.wait} Wait` : `Queue: ${cafe.wait}`} active={form.source === cafe.name} onClick={() => { setForm({ ...form, source: cafe.name }); next(); }} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 1 && (
                                     <div className="space-y-6">
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Items</label>
                                           <textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} placeholder="e.g. 1x Nasi Lemak Ayam, 1x Teh O Ais" className="w-full h-32 p-6 bg-slate-50 rounded-[22px] border-none text-[15px] font-medium focus:ring-2 focus:ring-navy/5" />
                                        </div>
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Lock (RM)</label>
                                           <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="Estimated total cost" className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold focus:ring-2 focus:ring-navy/5" />
                                        </div>
                                     </div>
                                  )}
                                  {currentStep === 2 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["ASAP (Urgent Hub)", "Scheduled (Next Break)", "Custom Time"].map(opt => (
                                           <OptionCard key={opt} label={opt} active={form.window === opt} onClick={() => { setForm({ ...form, window: opt }); next(); }} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 3 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["Meet at Lobby", "Leave at Classroom Door", "Security Desk"].map(opt => (
                                           <OptionCard key={opt} label={opt} active={form.handoff === opt} onClick={() => setForm({ ...form, handoff: opt })} />
                                        ))}
                                     </div>
                                  )}
                               </>
                            )}

                            {/* ── PARCEL LAYERS ── */}
                            {activeService.id === 'parcels' && (
                               <>
                                  {currentStep === 0 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["Standard Envelope", "Small Parcel (<2kg)", "Large Box (>5kg)", "Shopee / Lazada"].map(opt => (
                                           <OptionCard key={opt} label={opt} active={form.parcelType === opt} onClick={() => { setForm({ ...form, parcelType: opt }); next(); }} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 1 && (
                                     <div className="space-y-6">
                                        <div className="h-64 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-4">
                                           <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm"><Camera size={28} /></div>
                                           <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-center px-12">Upload Collection QR or SMS</p>
                                        </div>
                                        <div className="flex items-start gap-4 p-5 bg-indigo-50/50 rounded-[22px]">
                                           <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
                                           <p className="text-[12px] text-indigo-800/60 font-medium leading-relaxed">Security Protocol: This enables the runner to retrieve the item on your behalf without manual auth.</p>
                                        </div>
                                     </div>
                                  )}
                                  {currentStep === 2 && (
                                     <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-3">
                                           {["Walking Friendly", "Bicycle Required", "Vehicle Required"].map(opt => (
                                              <OptionCard key={opt} label={opt} active={form.weight === opt} onClick={() => { setForm({ ...form, weight: opt }); next(); }} />
                                           ))}
                                        </div>
                                     </div>
                                  )}
                                  {currentStep === 3 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["Block A Mailroom", "Lobby Security", "Hostel Admin Node"].map(opt => (
                                           <OptionCard key={opt} label={opt} icon={MapPin} active={form.pickupNode === opt} onClick={() => setForm({ ...form, pickupNode: opt })} />
                                        ))}
                                     </div>
                                  )}
                               </>
                            )}

                            {/* ── ACADEMIC LAYERS ── */}
                            {activeService.id === 'academic' && (
                               <>
                                  {currentStep === 0 && (
                                     <div className="space-y-6">
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Source</label>
                                           <input type="text" value={form.docUrl} onChange={e => setForm({ ...form, docUrl: e.target.value })} placeholder="Paste Drive link or directory path" className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-medium" />
                                        </div>
                                        <div className="h-40 rounded-[22px] bg-indigo-50/30 border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center text-indigo-300 gap-3">
                                           <FileText size={24} />
                                           <p className="text-[12px] font-bold uppercase tracking-wider">Direct PDF Upload</p>
                                        </div>
                                     </div>
                                  )}
                                  {currentStep === 1 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["B&W - Single Sided", "B&W - Double Sided", "Color - High Precision", "Staple & Bind"].map(opt => (
                                           <OptionCard key={opt} label={opt} active={form.printSpecs.includes(opt)} onClick={() => setForm({ ...form, printSpecs: [opt] })} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 2 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["UniStore (Block A)", "Library Node (L3)", "Admin Print Hub"].map(opt => (
                                           <OptionCard key={opt} label={opt} sublabel="Live Queue: 5 mins" active={form.source === opt} onClick={() => { setForm({ ...form, source: opt }); next(); }} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 3 && (
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Lab / Classroom</label>
                                        <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Lab 3-12, Level 3 MIIT" className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold" />
                                     </div>
                                  )}
                               </>
                            )}

                            {/* ── ERRAND LAYERS ── */}
                            {activeService.id === 'errands' && (
                               <>
                                  {currentStep === 0 && (
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Brief</label>
                                        <textarea value={form.errandBrief} onChange={e => setForm({ ...form, errandBrief: e.target.value })} placeholder="Provide granular operational instructions for the runner..." className="w-full h-40 p-6 bg-slate-50 rounded-[22px] border-none text-[15px] font-medium" />
                                     </div>
                                  )}
                                  {currentStep === 1 && (
                                     <div className="grid grid-cols-1 gap-3">
                                        {["Micro Assist (<15m)", "Standard Assist (30m+)", "Deep Assist (1h+)"].map(opt => (
                                           <OptionCard key={opt} label={opt} active={form.errandEffort === opt} onClick={() => { setForm({ ...form, errandEffort: opt }); next(); }} />
                                        ))}
                                     </div>
                                  )}
                                  {currentStep === 2 && (
                                     <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Petty Cash (RM)</label>
                                        <input type="number" value={form.errandCost} onChange={e => setForm({ ...form, errandCost: e.target.value })} placeholder="e.g. 10.00" className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold" />
                                        <div className="p-5 bg-amber-50/50 rounded-[22px] flex items-start gap-4">
                                           <CreditCard className="text-amber-600 shrink-0" size={20} />
                                           <p className="text-[12px] text-amber-800/60 font-medium leading-relaxed">Financial Protocol: Material costs must be confirmed with the runner via handshake before execution.</p>
                                        </div>
                                     </div>
                                  )}
                                  {currentStep === 3 && (
                                     <div className="space-y-8">
                                        <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4">
                                           <div className="flex items-center gap-3">
                                              <ShieldCheck className="text-navy" size={20} />
                                              <p className="text-[13px] font-bold text-navy uppercase tracking-widest">Handshake Registry</p>
                                           </div>
                                           <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                              I acknowledge that this directive complies with the UniKL MIIT Student Code of Conduct and operational safety protocols.
                                           </p>
                                        </div>
                                        <button onClick={() => setForm({ ...form, confirmed: true })} className="w-full h-16 bg-navy text-white rounded-[22px] font-bold text-[15px] flex items-center justify-center gap-3">
                                           <CheckCircle2 size={20} /> Accept & Lock Directive
                                        </button>
                                     </div>
                                  )}
                               </>
                            )}

                         </div>
                      </div>
                   </div>

                   {/* FUNNEL FOOTER */}
                   <div className="p-8 pb-12 bg-white border-t border-[#F2F2F7] flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                         <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-300" />
                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Est. Completion: 12 Mins</p>
                         </div>
                         <p className="text-[18px] font-black text-navy">RM 4.50</p>
                      </div>
                      
                      {/* Dynamic Primary Action */}
                      {(currentStep === 1 || (currentStep === 3 && activeService.id !== 'errands')) && (
                         <button 
                           disabled={submitting}
                           onClick={() => { if(currentStep < 3) next(); else handleFinalizeDirective(); }}
                           className="w-full h-[64px] bg-navy text-white rounded-[22px] font-bold text-[15px] tracking-tight active:scale-[0.98] transition-all shadow-xl shadow-navy/10 flex items-center justify-center gap-3 disabled:opacity-50"
                         >
                            {submitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {currentStep === 3 ? 'Finalize Directive' : 'Confirm & Proceed'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                         </button>
                      )}
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

          <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
       </main>
    );
}
