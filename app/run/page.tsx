'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChevronLeft, X, Loader2, ChevronRight, ArrowRight, Package, Map, History, Upload, Check, Search, ShieldCheck } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[19px] font-bold text-slate-900 tracking-tight ${className}`}>{children}</h2>
);
const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[12px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>{children}</p>
);

//  VOXEL ICONS 
const VoxelLogistics = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="10" width="16" height="8" fill="currentColor" rx="1" /><rect x="14" y="6" width="8" height="12" fill="currentColor" opacity="0.6" rx="1" /><rect x="4" y="18" width="4" height="2" fill="currentColor" rx="0.5" /><rect x="12" y="18" width="4" height="2" fill="currentColor" rx="0.5" /></svg>
);
const VoxelErrands = ({ className, size = 24 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}><rect x="8" y="4" width="8" height="8" fill="currentColor" rx="1" /><rect x="4" y="14" width="16" height="6" fill="currentColor" opacity="0.6" rx="1" /></svg>
);

const SERVICES = [
  { id: 'parcels',  label: 'Parcel & Mail',     icon: VoxelLogistics, desc: 'Guard house & mailroom pickups',     accent: 'text-cyan-950',  iconBg: 'bg-cyan-50', circleBg: 'bg-cyan-200/70', selectedStyle: 'bg-cyan-50 border-cyan-300 text-cyan-950', themeColor: 'bg-cyan-500', fee: 5.00,
    steps: [{ title: 'Details',    desc: 'Parcel info and pickup point' },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' },
            { title: 'Review',     desc: 'Confirm your request'        }] },
  { id: 'errands',  label: 'Peer-to-Peer Drop', icon: VoxelErrands,   desc: 'Campus document & key passing',      accent: 'text-rose-950', iconBg: 'bg-rose-50', circleBg: 'bg-rose-200/60', selectedStyle: 'bg-rose-50 border-rose-300 text-rose-950', themeColor: 'bg-rose-500', fee: 4.00,
    steps: [{ title: 'Details',    desc: 'Describe the item and pickup' },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' },
            { title: 'Review',     desc: 'Confirm your request'        }] },
];

//  COMPACT COMPONENTS 
const ChipRow = ({ options, value, onChange, activeService }: { options: string[]; value: string; onChange: (v: string) => void; activeService?: any }) => {
  const activeClass = activeService?.selectedStyle ? `${activeService.selectedStyle} border-[1.5px]` : 'bg-slate-900 text-white border-[1.5px] border-slate-900';
  const inactiveClass = `bg-slate-50 text-slate-400 border-[1.5px] border-slate-50 hover:border-slate-100`;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`h-11 px-4 rounded-[14px] text-[12px] font-bold transition-all active:scale-95 grow basis-[calc(50%-4px)] flex items-center justify-center ${value === opt ? activeClass : inactiveClass}`}>
          {opt}
        </button>
      ))}
    </div>
  );
};

const Field = ({ label, placeholder, value, onChange, multiline = false }: any) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold ml-1 text-slate-400 uppercase tracking-tight">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[18px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 placeholder:text-slate-300 resize-none transition-all" />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-[14px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 placeholder:text-slate-300 transition-all" />
      }
    </div>
  );
};

const ImageDropzone = ({ fileName, onFileSelected }: { fileName: string, onFileSelected: (f: File) => void }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold ml-1 text-slate-400 uppercase tracking-tight">Parcel Photo (Optional)</label>
      <div className="w-full relative group">
        <input type="file" accept="image/*" onChange={(e) => {
          if(e.target.files?.[0]) onFileSelected(e.target.files[0]);
        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className={`w-full h-14 rounded-[14px] border border-dashed flex items-center justify-center transition-all ${fileName ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}>
          {fileName ? (
            <div className="flex items-center gap-2 px-4 w-full text-cyan-600">
              <Check size={14} />
              <p className="text-[12px] font-bold truncate">{fileName}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Upload size={14} />
              <span className="text-[12px] font-bold">Attach Photo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailedAddressField = ({ title, value, onChange, nameLabel = "Recipient Name", phoneLabel = "Phone Number" }: { title: string, value: any, onChange: (v: any) => void, nameLabel?: string, phoneLabel?: string }) => {
  return (
    <div className="space-y-3 bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight px-1">{title}</p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input type="text" placeholder={nameLabel} value={value.name || ''} onChange={e => onChange({...value, name: e.target.value})}
            className="w-1/2 h-10 px-3 bg-slate-50 border border-slate-50 rounded-[12px] text-[12px] font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-200 transition-all" />
          <input type="text" placeholder={phoneLabel} value={value.phone || ''} onChange={e => onChange({...value, phone: e.target.value})}
            className="w-1/2 h-10 px-3 bg-slate-50 border border-slate-50 rounded-[12px] text-[12px] font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-200 transition-all" />
        </div>
        <input type="text" placeholder="Building/Block/Floor" value={value.location || ''} onChange={e => onChange({...value, location: e.target.value})}
          className="w-full h-10 px-3 bg-slate-50 border border-slate-50 rounded-[12px] text-[12px] font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-200 transition-all" />
        <input type="text" placeholder="Room/Unit (Optional)" value={value.detail || ''} onChange={e => onChange({...value, detail: e.target.value})}
          className="w-full h-10 px-3 bg-slate-50 border border-slate-50 rounded-[12px] text-[12px] font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-200 transition-all" />
      </div>
    </div>
  );
};

export default function RunModule() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [activeService, setActiveService] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState(false);
  const [customFee, setCustomFee] = useState<string>('');
  const [form, setForm] = useState<any>({
    parcelSize: '', parcelVerification: '', parcelImageName: '', parcelImageObj: null, pickupNode: '', 
    dropOffAddress: { name: '', phone: '', location: '', detail: '' },
    errandBrief: '', errandSize: '', errandInstructions: '', errandImageName: '', errandImageObj: null,
    errandPickup: { name: '', phone: '', location: '', detail: '' },
    errandDropoff: { name: '', phone: '', location: '', detail: '' }
  });

  useEffect(() => {
    let unsubProfile: any;
    let unsubMissions: any;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()), e => console.error(e));
        const q = query(
          collection(db, 'orders'),
          where('runner_id', '==', user.uid),
          where('status', 'in', ['RUNNER_ON_THE_WAY', 'DELIVERING', 'RUNNER_DELIVERING', 'PICKED_UP', 'ARRIVED_AT_PICKUP', 'ARRIVED_AT_MERCHANT', 'ARRIVED_AT_BUILDING', 'ARRIVED_AT_BUYER', 'ACCEPTED'])
        );
        unsubMissions = onSnapshot(q, snap => setActiveMission(!snap.empty), e => console.error(e));
      }
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubMissions) unsubMissions();
    };
  }, []);

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    if (profile?.is_online && activeMission) {
      setStatusError('Cannot go offline while on a mission.');
      setTimeout(() => setStatusError(null), 3000);
      return;
    }
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { is_online: !profile?.is_online, last_active: serverTimestamp() });
  };

  const setF = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const isStepValid = () => {
    const s = activeService?.id;
    if (s === 'parcels') {
      if (currentStep === 0) return !!(form.parcelSize && form.pickupNode);
      if (currentStep === 1) return !!(form.dropOffAddress.location && form.dropOffAddress.name);
    }
    if (s === 'errands') {
      if (currentStep === 0) return !!(form.errandBrief && form.errandSize && form.errandPickup.location);
      if (currentStep === 1) return !!(form.errandDropoff.location && form.errandDropoff.name);
    }
    return true;
  };

  const handleFinalizeRequest = async () => {
    if (!auth.currentUser) return router.push('/auth');
    setSubmitting(true);
    try {
      let downloadUrl = '';
      const isParcel = activeService.id === 'parcels';
      const imgObj = isParcel ? form.parcelImageObj : form.errandImageObj;
      const imgName = isParcel ? form.parcelImageName : form.errandImageName;

      if (imgObj) {
        const storageRef = ref(storage, `${activeService.id}/${Date.now()}_${imgName}`);
        await uploadBytes(storageRef, imgObj);
        downloadUrl = await getDownloadURL(storageRef);
      }

      const formatAddress = (addr: any) => `${addr.location}${addr.detail ? `, ${addr.detail}` : ''} (${addr.name}, ${addr.phone})`;

      const orderRef = await addDoc(collection(db, 'orders'), {
        buyer_id: auth.currentUser.uid,
        buyer_name: profile?.full_name || 'Student',
        title: activeService.label,
        type: activeService.id.toUpperCase(),
        pickup_location: isParcel ? form.pickupNode : formatAddress(form.errandPickup),
        drop_off_location: isParcel ? formatAddress(form.dropOffAddress) : formatAddress(form.errandDropoff),
        total_price: parseFloat(customFee) || activeService.fee || 4.50,
        items_summary: isParcel ? `${form.parcelSize} Parcel` : `${form.errandSize}: ${form.errandBrief}${form.errandInstructions ? ` (${form.errandInstructions})` : ''}`,
        attached_file: downloadUrl,
        status: 'PENDING_RUNNER',
        created_at: serverTimestamp()
      });
      router.push(`/run/success?id=${orderRef.id}&type=${activeService.id}`);
    } catch (e) {
      console.error(e);
    } finally { setSubmitting(false); }
  };

  const renderStep = () => {
    const id = activeService?.id;
    if (id === 'parcels') {
      if (currentStep === 0) return (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Parcel Size</p>
            <ChipRow activeService={activeService} options={['Small', 'Medium', 'Large']} value={form.parcelSize} onChange={v => setF('parcelSize', v)} />
          </div>
          <Field label="Where is the parcel?" placeholder="e.g. Block A Guard, Registry Mailroom" value={form.pickupNode} onChange={(v: string) => setF('pickupNode', v)} />
          <ImageDropzone fileName={form.parcelImageName} onFileSelected={(f) => { setF('parcelImageName', f.name); setForm((p:any) => ({...p, parcelImageObj: f})); }} />
        </div>
      );
      if (currentStep === 1) return <DetailedAddressField title="Deliver To" value={form.dropOffAddress} onChange={(v: any) => setF('dropOffAddress', v)} />;
      if (currentStep === 2) return (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase px-1">Summary</p>
          {[
            { label: 'Parcel', value: form.parcelSize },
            { label: 'From', value: form.pickupNode },
            { label: 'To', value: form.dropOffAddress.location },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2.5 border-b border-slate-50">
              <span className="text-[12px] font-bold text-slate-400">{r.label}</span>
              <span className="text-[12px] font-bold text-slate-900">{r.value}</span>
            </div>
          ))}
        </div>
      );
    }
    if (id === 'errands') {
      if (currentStep === 0) return (
        <div className="space-y-4">
          <Field label="What to pass?" placeholder="e.g. Room keys, textbook" value={form.errandBrief} onChange={(v: string) => setF('errandBrief', v)} />
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Item Size / Handling</p>
            <ChipRow activeService={activeService} options={['Pocket Size', 'Bag / Bulky', 'Fragile']} value={form.errandSize} onChange={v => setF('errandSize', v)} />
          </div>
          <Field label="Pick-up Point" placeholder="e.g. MIIT Level 2 Lobby" value={form.errandPickup.location} onChange={(v: string) => setF('errandPickup', { ...form.errandPickup, location: v })} />
          <Field label="Meetup Note" placeholder="e.g. Red jacket" value={form.errandInstructions} onChange={(v: string) => setF('errandInstructions', v)} />
          <ImageDropzone fileName={form.errandImageName} onFileSelected={(f) => { setF('errandImageName', f.name); setForm((p:any) => ({...p, errandImageObj: f})); }} />
        </div>
      );
      if (currentStep === 1) return <DetailedAddressField title="Drop-off Point" value={form.errandDropoff} onChange={(v: any) => setF('errandDropoff', v)} />;
      if (currentStep === 2) return (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase px-1">Summary</p>
          {[
            { label: 'Item', value: form.errandBrief },
            { label: 'From', value: form.errandPickup.location },
            { label: 'To', value: form.errandDropoff.location },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2.5 border-b border-slate-50">
              <span className="text-[12px] font-bold text-slate-400">{r.label}</span>
              <span className="text-[12px] font-bold text-slate-900">{r.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] active:scale-95 transition-all">
             <ChevronLeft size={20} />
          </button>
          <p className="text-[14px] font-bold tracking-tight">Deliveries</p>
        </div>
        <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
      </nav>

      <div className="pt-28 px-6 space-y-10 max-w-lg mx-auto">
        {activeService ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <div>
                <Heading>{activeService.label}</Heading>
                <Subtext>{activeService.steps[currentStep].desc}</Subtext>
              </div>
              <button onClick={() => setActiveService(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><X size={16} /></button>
            </div>
            <div className="flex gap-1.5 mb-2">
              {activeService.steps.map((s: any, i: number) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? activeService.themeColor : 'bg-slate-100'}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={currentStep === activeService.steps.length - 1 ? handleFinalizeRequest : () => setCurrentStep(s => s + 1)}
                disabled={!isStepValid() || submitting}
                className={`w-full h-14 rounded-full text-[14px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md ${activeService.themeColor} text-white disabled:opacity-20`}>
                {submitting ? <Loader2 size={20} className="animate-spin" /> : currentStep === activeService.steps.length - 1 ? 'Confirm' : 'Continue'}
                {!submitting && <ArrowRight size={18} />}
              </button>
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="w-full h-12 text-slate-400 font-bold text-[13px] active:scale-95 transition-all">Back</button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {profile?.is_verified_runner ? (
              <div className="space-y-6">
                <div className="px-1">
                  <Heading>Runner Dashboard</Heading>
                  <Subtext>Manage missions and earnings</Subtext>
                </div>
                <button onClick={() => router.push('/run/wallet')} className="w-full bg-slate-50 p-6 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all text-left">
                  <div className="flex items-center gap-5">
                    <div className={`w-1.5 h-12 rounded-full ${profile?.is_online ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div>
                      <p className="text-[28px] font-bold text-slate-900 tracking-tighter leading-none">RM {(profile?.balance || 0).toFixed(2)}</p>
                      <p className="text-[11px] text-[#94a3b8] font-bold mt-1 tracking-tight flex items-center gap-1">Wallet <ChevronRight size={12} /></p>
                    </div>
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); toggleStatus(); }} className={`h-11 px-5 rounded-2xl text-[12px] font-bold border transition-all flex items-center gap-2 ${profile?.is_online ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {profile?.is_online && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    <span>{profile?.is_online ? 'Online' : 'Offline'}</span>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => profile?.is_online && router.push('/run/missions')} disabled={!profile?.is_online} className={`w-full flex flex-col items-start gap-4 p-5 rounded-[24px] transition-all shadow-sm ${profile?.is_online ? 'bg-cyan-50 text-cyan-950 active:scale-95' : 'bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${profile?.is_online ? 'bg-cyan-200/70' : 'bg-slate-200'}`}><Package size={20} strokeWidth={2.5} /></div>
                    <p className="text-[14px] font-bold tracking-tight">Missions</p>
                  </button>
                  <button onClick={() => router.push('/run/history')} className="w-full flex flex-col items-start gap-4 p-5 rounded-[24px] bg-violet-50 transition-all active:scale-95 text-violet-950 shadow-sm">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-200/60"><History size={20} strokeWidth={2.5} /></div>
                    <p className="text-[14px] font-bold tracking-tight">History</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100/80 p-6 rounded-[24px] space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/70 flex items-center justify-center shrink-0">
                    <Package size={24} className="text-amber-700" strokeWidth={2} />
                  </div>
                  <div>
                    <Heading>Become a Runner</Heading>
                    <Subtext>Earn money delivering on campus</Subtext>
                  </div>
                </div>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  Help fellow students get their parcels, food, and essentials. Set your own schedule and earn per delivery.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 rounded-full bg-emerald-200/60" />
                  <div className="flex-1 h-2 rounded-full bg-amber-200/60" />
                  <div className="flex-1 h-2 rounded-full bg-violet-200/60" />
                </div>
                <button
                  onClick={() => router.push('/run/onboarding')}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center gap-2 text-[14px] font-bold active:scale-95 transition-all shadow-md hover:bg-slate-800"
                >
                  Apply to be a Runner <ArrowRight size={18} />
                </button>
              </div>
            )}
            <div className="space-y-6">
              <div className="px-1">
                <Heading>New Request</Heading>
                <Subtext>Select a service to get started</Subtext>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(s => (
                  <button key={s.id} onClick={() => { setActiveService(s); setCurrentStep(0); setCustomFee(s.fee.toFixed(2)); }}
                    className={`p-5 rounded-[28px] border border-slate-50 flex flex-col items-start gap-4 transition-all active:scale-95 shadow-sm ${s.iconBg} hover:shadow-md`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.circleBg} ${s.accent}`}>
                      <s.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-left"><p className={`text-[14px] font-bold tracking-tight ${s.accent}`}>{s.label}</p><p className={`text-[10px] font-medium opacity-60 ${s.accent} mt-0.5`}>{s.desc}</p></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
