'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Bell, 
  X,
  Loader2,
  Navigation,
  MapPin,
  Camera,
  Package
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerDashboard from './RunnerDashboard'; 

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

const SERVICES = [
  { 
    id: 'food', 
    label: 'Food & Cravings', 
    icon: VoxelFood, 
    height: 'h-[240px]',
    color: 'bg-[#F59E0B]',
    shadow: 'bg-[#B45309]',
    tags: []
  },
  { 
    id: 'parcels', 
    label: 'Parcel & Mail', 
    icon: VoxelLogistics, 
    height: 'h-[180px]',
    color: 'bg-[#64748B]',
    shadow: 'bg-[#334155]',
    tags: ['Pickup', 'Drop-off']
  },
  { 
    id: 'academic', 
    label: 'Academic Print', 
    icon: VoxelBooks, 
    height: 'h-[210px]',
    color: 'bg-[#6366F1]',
    shadow: 'bg-[#3730A3]',
    tags: ['Printing', 'Binding', 'Lab Delivery']
  },
  { 
    id: 'errands', 
    label: 'Custom Errands', 
    icon: VoxelErrands, 
    height: 'h-[140px]',
    color: 'bg-[#A855F7]',
    shadow: 'bg-[#7E22CE]',
    tags: ['Personal Shopping', 'Queue Assist', 'Document Drop']
  },
];

const UNIKL_HOTSPOTS = ["Cafe Block A", "MIIT Level 2", "Lobby", "Library", "Starbucks", "West Wing"];

const SPRING = { type: 'spring', stiffness: 400, damping: 25 };

// ── VOXEL CONTAINER COMPONENT (Standardized from Hub) ──
const VoxelCard = ({ id, label, Icon, height, color, shadow, onClick, isHero = false, isWide = false }: any) => (
  <motion.button 
    layoutId={`card-${id}`}
    onClick={onClick}
    className={`relative w-full ${height} group transition-all duration-300 active:scale-[0.98] cursor-pointer`}
  >
    {/* 3D Base (Shadow/Extrusion) */}
    <div className={`absolute inset-0 translate-y-2 translate-x-1.5 rounded-[22px] ${shadow} transition-all duration-300 group-hover:translate-y-3 group-hover:translate-x-2`} />
    
    {/* Main Voxel Block */}
    <div className={`absolute inset-0 rounded-[22px] ${color} border border-white/20 p-8 flex flex-col justify-between overflow-hidden transition-all duration-200 group-hover:-translate-y-1 shadow-xl`}>
       {(isHero || isWide) && <Icon className="absolute top-1/2 right-[-20px] -translate-y-1/2 text-white opacity-[0.08] scale-[5]" />}
       
       <div className="relative z-10">
          <Icon className="text-white mb-4" size={24} />
       </div>
       
       <div className="relative z-10">
          <h4 className={`text-white font-bold tracking-tight leading-tight ${isHero ? 'text-[24px]' : 'text-[18px]'}`}>
             {label.split(' ').length > 2 || isWide ? label : <>{label.split(' ')[0]} <br/> {label.split(' ').slice(1).join(' ')}</>}
          </h4>
       </div>
    </div>
  </motion.button>
);

export default function RunHub() {
    const router = useRouter();
    const [view, setView] = useState<'consumer' | 'carrier'>('consumer');
    const [profile, setProfile] = useState<any>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'verified'>('loading');
    
    const [form, setForm] = useState({ source: '', target: '', urgency: 'Standard' });

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

    const isFormComplete = form.source && form.target;

    if (status === 'loading') return <main className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-navy" /></main>;

    if (view === 'carrier' && profile?.runner_status === 'active') {
        return <RunnerDashboard profile={profile} onBack={() => setView('consumer')} />;
    }

    return (
       <main className="min-h-screen bg-white pb-32 font-sans antialiased text-navy overflow-x-hidden">
          
          <nav className="fixed top-0 left-0 right-0 z-[60] px-8 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-xl">
             <div className="flex items-center gap-4">
                <button onClick={() => router.push('/home')} className="p-2 -ml-2 text-slate-300 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                <h1 className="text-[14px] font-bold tracking-[0.2em] uppercase opacity-40">Run Terminal</h1>
             </div>
             <div className="flex items-center gap-4">
                <button className="text-slate-300 active:scale-90 transition-all relative">
                    <Bell size={20} />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full border-2 border-white" />
                </button>
                <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
             </div>
          </nav>

          <div className="pt-32 px-8 space-y-12">
             
             <LayoutGroup>
                <section className="space-y-10">
                   <div className="space-y-2">
                      <h2 className="text-[32px] font-bold tracking-tightest leading-[1.1] text-navy">
                        Logistics <br/>Directives
                      </h2>
                      <p className="text-[13px] text-slate-400 font-medium tracking-tight">Select your operational sector below.</p>
                   </div>
                   
                   {/* ── PIXELATE (VOXEL) ASYMMETRICAL LAYOUT ── */}
                   <div className="space-y-6">
                      {/* Hero Slate: Food & Cravings */}
                      <VoxelCard 
                        {...SERVICES[0]} 
                        Icon={VoxelFood}
                        isHero={true} 
                        onClick={() => setSelectedId('food')} 
                      />

                      <div className="flex gap-5 items-start">
                         {/* Parcel & Mail */}
                         <VoxelCard 
                           {...SERVICES[1]} 
                           Icon={VoxelLogistics}
                           onClick={() => setSelectedId('parcels')} 
                         />

                         {/* Academic Print */}
                         <VoxelCard 
                           {...SERVICES[2]} 
                           Icon={VoxelBooks}
                           onClick={() => setSelectedId('academic')} 
                         />
                      </div>

                      {/* Custom Errands (Wide Anchor) */}
                      <VoxelCard 
                        {...SERVICES[3]} 
                        Icon={VoxelErrands}
                        isWide={true}
                        onClick={() => setSelectedId('errands')} 
                      />
                   </div>
                </section>
             </LayoutGroup>

             <AnimatePresence>
                {selectedId && (
                   <motion.div 
                     layoutId={`card-${selectedId}`}
                     transition={SPRING}
                     className="fixed inset-0 z-[100] bg-white flex flex-col p-8 overflow-y-auto no-scrollbar"
                   >
                      <div className="flex justify-between items-start mb-12 pt-4">
                         <div className="space-y-4">
                            <div className="flex items-center gap-4">
                               {selectedId === 'food' && <VoxelFood className="text-navy" size={28} />}
                               {selectedId === 'parcels' && <VoxelLogistics className="text-navy" size={28} />}
                               {selectedId === 'academic' && <VoxelBooks className="text-navy" size={28} />}
                               {selectedId === 'errands' && <VoxelErrands className="text-navy" size={28} />}
                               <h2 className="text-[28px] font-bold tracking-tightest">{SERVICES.find(s => s.id === selectedId)?.label}</h2>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                               {SERVICES.find(s => s.id === selectedId)?.tags.map(tag => (
                                  <span key={tag} className="px-4 py-2 bg-[#F5F5F7] text-navy/40 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                                     {tag}
                                  </span>
                               ))}
                            </div>
                         </div>
                         <button onClick={() => { setSelectedId(null); }} className="p-3 bg-slate-50 rounded-full text-navy/20 active:scale-90 transition-all"><X size={24}/></button>
                      </div>

                      <div className="flex-1 space-y-16 pb-32">
                         <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-[#86868B] uppercase tracking-[2px]">Where is the {selectedId}?</h4>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-8 px-8">
                               {UNIKL_HOTSPOTS.map(spot => (
                                  <button 
                                    key={spot}
                                    onClick={() => setForm({ ...form, source: spot })}
                                    className={`px-8 py-5 rounded-[16px] text-[15px] font-bold whitespace-nowrap transition-all duration-300 ${form.source === spot ? 'bg-[#1D1D1F] text-white shadow-xl shadow-navy/20' : 'bg-[#F5F5F7] text-[#86868B]'}`}
                                  >
                                     {spot}
                                  </button>
                               ))}
                            </div>
                         </section>

                         <motion.section 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: form.source ? 1 : 0.3, y: form.source ? 0 : 20 }}
                           className="space-y-6"
                         >
                            <h4 className="text-[10px] font-black text-[#86868B] uppercase tracking-[2px]">Operational Target</h4>
                            <div className="flex gap-4">
                               <button 
                                 onClick={() => setForm({ ...form, target: 'Current GPS' })}
                                 className={`flex-1 h-20 rounded-[16px] flex flex-col items-center justify-center gap-2 font-bold text-[14px] transition-all ${form.target === 'Current GPS' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#86868B]'}`}
                               >
                                  <Navigation size={20} /> Use My Location
                               </button>
                               <button 
                                 onClick={() => setForm({ ...form, target: 'Manual Selection' })}
                                 className={`flex-1 h-20 rounded-[16px] flex flex-col items-center justify-center gap-2 font-bold text-[14px] transition-all ${form.target === 'Manual Selection' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#86868B]'}`}
                               >
                                  <MapPin size={20} /> Set Manually
                               </button>
                            </div>
                         </motion.section>

                         <motion.section 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: form.target ? 1 : 0 }}
                           className="space-y-6"
                         >
                            <h4 className="text-[10px] font-black text-[#86868B] uppercase tracking-[2px]">Verification</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <button className="h-20 rounded-[16px] bg-[#F5F5F7] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-[#86868B] font-bold text-[12px]">
                                  <Camera size={20} /> Attachment
                               </button>
                               <button className="h-20 rounded-[16px] bg-[#F5F5F7] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-[#86868B] font-bold text-[12px]">
                                  <Package size={20} /> Size Protocol
                               </button>
                            </div>
                         </motion.section>
                      </div>

                      <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-50 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#86868B] uppercase tracking-[2px]">Energy Fee</p>
                            <p className="text-[24px] font-bold text-[#1D1D1F]">RM 4.50</p>
                         </div>
                         <button 
                           disabled={!isFormComplete}
                           className={`h-16 px-10 rounded-[20px] font-black text-[14px] tracking-widest uppercase transition-all duration-500 ${isFormComplete ? 'bg-[#1D1D1F] text-white shadow-2xl' : 'bg-slate-50 text-slate-200'}`}
                         >
                            Initiate Sequence
                         </button>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>

             <footer className="pt-20 pb-10 flex flex-col items-center">
                <button 
                  onClick={() => router.push('/run/onboarding')}
                  className="text-[12px] font-bold text-navy/30 hover:text-navy transition-all uppercase tracking-[1.5px]"
                >
                   Apply to be a Runner
                </button>
             </footer>

          </div>
       </main>
    );
}
