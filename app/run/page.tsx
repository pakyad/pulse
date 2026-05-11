'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { 
  ChevronLeft, X, Loader2, Navigation, MapPin, Camera, Package, 
  ChevronDown, ArrowRight, Zap, ChevronRight, Clock, FileText, 
  ShieldCheck, CreditCard, CheckCircle2, LayoutGrid, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import { updateDoc, serverTimestamp } from 'firebase/firestore';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
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

const SERVICES = [
  { id: 'food', label: 'Food & Cravings', icon: VoxelFood, desc: 'Cafe Block A, Starbucks, West Wing', accent: 'text-amber-600', steps: [{ title: "Selection", desc: "Choose your source" }, { title: "Order List", desc: "List your items" }, { title: "Schedule", desc: "Set your time window" }, { title: "Delivery", desc: "Set drop-off location" }] },
  { id: 'parcels', label: 'Parcel & Mail', icon: VoxelLogistics, desc: 'Shopee, Lazada, Mail', accent: 'text-slate-600', steps: [{ title: "Item Type", desc: "Categorize size" }, { title: "Verification", desc: "Security check" }, { title: "Weight", desc: "Capacity check" }, { title: "Drop-off", desc: "Select location" }] },
  { id: 'academic', label: 'Academic Print', icon: VoxelBooks, desc: 'UniStore, Library Hub', accent: 'text-indigo-600', steps: [{ title: "Files", desc: "Provide details" }, { title: "Specs", desc: "Color, Binding" }, { title: "Service", desc: "Select hub" }, { title: "Destination", desc: "Lab or Classroom" }] },
  { id: 'errands', label: 'Custom Tasks', icon: VoxelErrands, desc: 'Flexible errands & requests', accent: 'text-purple-600', steps: [{ title: "Brief", desc: "Task summary" }, { title: "Duration", desc: "Time projection" }, { title: "Funds", desc: "Petty cash" }, { title: "Review", desc: "Final check" }] },
];

const OptionCard = ({ label, sublabel, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full h-20 px-6 rounded-[22px] flex items-center justify-between border-2 transition-all ${active ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xl shadow-slate-900/10' : 'bg-slate-50 text-[#1e293b] border-transparent'}`}>
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
  const iconBg = id === 'food' ? 'bg-amber-100' : id === 'parcels' ? 'bg-slate-100' : id === 'academic' ? 'bg-indigo-100' : 'bg-purple-100';
  return (
    <button onClick={onClick} className="w-full h-[96px] px-6 bg-slate-50/50 border border-slate-100 rounded-[28px] flex items-center justify-between group active:scale-[0.98] transition-all">
       <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
             <Icon className={accent} size={28} />
          </div>
          <div className="text-left">
             <h4 className="text-[16px] font-bold text-[#1e293b] tracking-tight">{label}</h4>
             <p className="text-[13px] text-[#94a3b8] font-medium mt-0.5">{desc}</p>
          </div>
       </div>
       <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
    </button>
  );
};

export default function RunModule() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [activeService, setActiveService] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<any>({ source: '', items: '', budget: '', window: 'ASAP', handoff: '', parcelType: '', weight: '', pickupNode: '', docUrl: '', printSpecs: [], destination: '', errandBrief: '', errandEffort: '', errandCost: '' });

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged(user => {
            if (user) onSnapshot(doc(db, "users", user.uid), (snap) => setProfile(snap.data()));
        });
        return () => unsubAuth();
    }, []);

    const toggleStatus = async () => {
        if (!auth.currentUser) return;
        setSubmitting(true);
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { 
                is_online: !profile?.is_online, 
                last_active: serverTimestamp() 
            });
        } catch (e) { console.error(e); } finally { setSubmitting(false); }
    };

    const handleFinalizeRequest = async () => {
        if (!auth.currentUser) return router.push('/auth');
        setSubmitting(true);
        try {
            const createRunFn = httpsCallable(functions, 'createRunDirective');
            const res: any = await createRunFn({ serviceId: activeService.id, label: activeService.label, source: form.source || activeService.desc.split(',')[0], dest: form.destination || form.handoff || form.pickupNode || 'Campus', fee: 4.50, items: form.items || form.errandBrief || 'Delivery Request', type: activeService.id.toUpperCase(), zone: 'ALL' });
            router.push(`/orders/success?id=${res.data.orderId}`);
        } catch (e) { alert("Failed to submit request."); } finally { setSubmitting(false); }
    };

    return (
       <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-32">
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Deliveries</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
      </nav>

      <div className="pt-28 px-6 space-y-12">
         {profile?.is_verified_runner && (
            <div className="space-y-6">
                   <div className="px-1">
                      <Heading>Runner Dashboard</Heading>
                      <Subtext>Manage your active missions and earnings</Subtext>
                   </div>
                   
                    <div className="space-y-6">
                       {/* ── EARNINGS HERO CARD ── */}
                       <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/80 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-6">
                             <div className={`w-1.5 h-12 rounded-full transition-all duration-500 ${profile?.is_online ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                             <div className="text-left">
                                <p className="text-[28px] font-bold text-slate-900 tracking-tighter leading-none">RM {(profile?.balance || 0).toFixed(2)}</p>
                                <p className="text-[13px] text-slate-400 font-bold mt-2 lowercase tracking-tight">today's earnings</p>
                             </div>
                          </div>
                          <button 
                            onClick={toggleStatus}
                            className={`h-11 px-6 rounded-2xl text-[12px] font-bold transition-all flex items-center gap-2.5 border ${profile?.is_online ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                             {profile?.is_online && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                             <span className="lowercase">{profile?.is_online ? 'online' : 'offline'}</span>
                          </button>
                       </div>

                       {/* ── SECONDARY OPERATIONAL ACTIONS ── */}
                       <div className="px-1 space-y-4 pt-6">
                          <button 
                            onClick={() => router.push('/run/missions')} 
                            className="w-full flex items-center justify-between group py-2"
                          >
                             <div className="text-left">
                                <p className="text-[15px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors tracking-tight">Available Jobs</p>
                                <p className="text-[12px] text-slate-400 font-medium lowercase">browse active missions</p>
                             </div>
                             <ArrowRight size={16} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                          </button>

                          <div className="h-px bg-slate-50" />

                          <button 
                            onClick={() => router.push('/run/terminal')} 
                            className="w-full flex items-center justify-between group py-2"
                          >
                             <div className="text-left">
                                <p className="text-[15px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors tracking-tight">Delivery Hub</p>
                                <p className="text-[12px] text-slate-400 font-medium lowercase">open terminal tools</p>
                             </div>
                             <ArrowRight size={16} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                          </button>
                       </div>
                    </div>
                 </div>
              )}

              <div className="space-y-12">
                 <div className="px-1">
                    <Heading>Request Delivery</Heading>
                    <Subtext>Get help with food, parcels, or custom tasks on campus</Subtext>
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    {SERVICES.map(s => <ServiceStrip key={s.id} {...s} onClick={() => { setActiveService(s); setCurrentStep(0); }} />)}
                 </div>
              </div>
           </div>

          <AnimatePresence>
             {activeService && (
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-200 bg-white flex flex-col">
                   <div className="absolute top-0 left-0 right-0 h-1 bg-slate-50"><motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep+1)/4)*100}%` }} className="h-full bg-[#1e293b]" /></div>
                   <nav className="px-8 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
                      <button onClick={() => currentStep > 0 ? setCurrentStep(s => s-1) : setActiveService(null)} className="p-2 -ml-2 text-slate-300 transition-all active:scale-90"><ChevronLeft size={24} /></button>
                      <p className="text-[14px] font-bold text-[#1e293b] tracking-tight">{activeService.label}</p>
                      <button onClick={() => setActiveService(null)} className="p-2 text-slate-300 transition-all active:scale-90"><X size={24} /></button>
                   </nav>
                   <div className="flex-1 p-8 space-y-10 overflow-y-auto">
                      <div className="space-y-2">
                         <Subtext className="text-[11px] font-bold uppercase tracking-widest">Step {currentStep+1} of 4</Subtext>
                         <Heading className="text-[28px] leading-tight">{activeService.steps[currentStep].title}</Heading>
                         <Subtext>{activeService.steps[currentStep].desc}</Subtext>
                      </div>
                      <div className="space-y-4">
                         {activeService.id === 'food' && currentStep === 0 && UNIKL_CAFES.map(cafe => <OptionCard key={cafe.name} label={cafe.name} active={form.source === cafe.name} onClick={() => { setForm({...form, source: cafe.name}); setCurrentStep(1); }} />)}
                      </div>
                   </div>
                   <div className="p-8 pb-12 bg-white border-t border-slate-50 flex flex-col gap-6">
                      <div className="flex items-center justify-between px-2">
                         <Subtext>Estimated Delivery Fee</Subtext>
                         <p className="text-[20px] font-bold">RM 4.50</p>
                      </div>
                      <button onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleFinalizeRequest()} className="w-full h-16 bg-[#1e293b] text-white rounded-[24px] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                         {submitting ? <Loader2 className="animate-spin" /> : (currentStep === 3 ? 'Confirm Order' : 'Continue')}
                      </button>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
          <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
       </main>
    );
}

const UNIKL_CAFES = [{ name: "Cafe Block A" }, { name: "Starbucks MIIT" }, { name: "West Wing Cafeteria" }];


