'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChevronLeft, X, Loader2, ChevronRight, ArrowRight, Package, Map, History, Upload, Check } from 'lucide-react';

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
  { id: 'parcels',  label: 'Parcel & Mail',     icon: VoxelLogistics, desc: 'Guard house & mailroom pickups',     accent: 'text-cyan-950',  iconBg: 'bg-cyan-50', circleBg: 'bg-cyan-200/70', selectedStyle: 'bg-cyan-50 border-cyan-300 text-cyan-950', themeColor: 'bg-cyan-500', fee: 5.00,
    steps: [{ title: 'Details',    desc: 'Size and verification info'  },
            { title: 'Pickup',     desc: 'Where is the parcel now?'    },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' },
            { title: 'Review',     desc: 'Confirm your request'        }] },
  { id: 'errands',  label: 'Peer-to-Peer Drop', icon: VoxelErrands,   desc: 'Campus document & key passing',      accent: 'text-rose-950', iconBg: 'bg-rose-50', circleBg: 'bg-rose-200/60', selectedStyle: 'bg-rose-50 border-rose-300 text-rose-950', themeColor: 'bg-rose-500', fee: 4.00,
    steps: [{ title: 'Item Brief', desc: 'Describe the item to pass'   },
            { title: 'Pickup',     desc: 'Where is the item now?'      },
            { title: 'Drop-off',   desc: 'Where should we deliver it?' },
            { title: 'Review',     desc: 'Confirm your request'        }] },
];

// ── THEMED CHIP SELECTOR ──
const ChipRow = ({ options, value, onChange, activeService }: { options: string[]; value: string; onChange: (v: string) => void; activeService?: any }) => {
  const activeClass = activeService?.selectedStyle ? `${activeService.selectedStyle} shadow-sm border-[1.5px]` : 'bg-slate-900 text-white shadow-md border-[1.5px] border-slate-900';
  const inactiveClass = `bg-white text-slate-500 border-[1.5px] border-slate-100 hover:border-slate-200 shadow-sm`;
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`h-14 px-5 rounded-[20px] text-[13px] font-bold transition-all active:scale-95 grow basis-[calc(50%-6px)] flex items-center justify-center ${value === opt ? activeClass : inactiveClass}`}>
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
            className="w-full px-5 py-4 bg-white border-[1.5px] border-slate-100 rounded-[24px] text-[14px] font-medium text-slate-900 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-300 resize-none transition-all shadow-sm" />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full h-14 px-5 bg-white border-[1.5px] border-slate-100 rounded-[20px] text-[14px] font-medium text-slate-900 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-300 transition-all shadow-sm" />
      }
    </div>
  );
};

// ── IMAGE DROPZONE ──
const ImageDropzone = ({ fileName, onFileSelected }: { fileName: string, onFileSelected: (f: File) => void }) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 text-slate-400">Parcel Photo (Optional)</label>
      <div className="w-full relative group">
        <input type="file" accept="image/*" onChange={(e) => {
          if(e.target.files?.[0]) onFileSelected(e.target.files[0]);
        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className={`w-full h-20 rounded-[20px] border-2 border-dashed flex items-center justify-center transition-all ${fileName ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-slate-50 group-hover:border-cyan-300'}`}>
          {fileName ? (
            <div className="flex items-center gap-3 px-4 w-full">
              <div className="w-8 h-8 shrink-0 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center"><Check size={16} /></div>
              <p className="text-[13px] font-bold text-cyan-900 truncate">{fileName}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-slate-600">
                <Upload size={16} />
                <span className="text-[13px] font-bold">Upload Courier Photo</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">So the runner can spot it easily</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── DETAILED ADDRESS FIELD (SHOPEE STYLE) ──
const DetailedAddressField = ({ title, value, onChange, nameLabel = "Who to meet", phoneLabel = "Their Phone Number" }: { title: string, value: any, onChange: (v: any) => void, nameLabel?: string, phoneLabel?: string }) => {
  return (
    <div className="space-y-4 bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8]">{title}</p>
      
      <div className="space-y-3">
        <div className="flex gap-3">
          <input type="text" placeholder={nameLabel} value={value.name || ''} onChange={e => onChange({...value, name: e.target.value})}
            className="w-1/2 h-12 px-4 bg-slate-50 border border-slate-100 rounded-[16px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
          <input type="text" placeholder={phoneLabel} value={value.phone || ''} onChange={e => onChange({...value, phone: e.target.value})}
            className="w-1/2 h-12 px-4 bg-slate-50 border border-slate-100 rounded-[16px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
        </div>
        
        <input type="text" placeholder="Building, Street, or Main Location" value={value.location || ''} onChange={e => onChange({...value, location: e.target.value})}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-[16px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
          
        <input type="text" placeholder="Unit No, Room, or Specific Detail (Optional)" value={value.detail || ''} onChange={e => onChange({...value, detail: e.target.value})}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-[16px] text-[13px] font-medium text-slate-900 outline-none focus:border-slate-300 transition-all" />
      </div>
    </div>
  );
};

export default function RunModule() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [activeService, setActiveService] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState(false);
  const [customFee, setCustomFee] = useState<string>('');
  const [form, setForm] = useState<any>({
    // parcels
    parcelSize: '', parcelVerification: '', parcelImageName: '', parcelImageObj: null, pickupNode: '', 
    dropOffAddress: { name: '', phone: '', location: '', detail: '' },
    // errands
    errandBrief: '', errandSize: '', errandImageName: '', errandImageObj: null,
    errandPickup: { name: '', phone: '', location: '', detail: '' }, 
    errandDropoff: { name: '', phone: '', location: '', detail: '' },
  });

  const setF = (key: string, val: string) => setForm((p: any) => ({ ...p, [key]: val }));

  useEffect(() => {
    let unsubProfile: any;
    let unsubMissions: any;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
        const q = query(
          collection(db, 'orders'), 
          where('runner_id', '==', user.uid), 
          where('status', 'in', [
            'RUNNER_ON_THE_WAY', 'DELIVERING', 'RUNNER_DELIVERING', 
            'PICKED_UP', 'ARRIVED_AT_PICKUP', 'ARRIVED_AT_MERCHANT', 
            'ARRIVED_AT_BUILDING', 'ARRIVED_AT_BUYER', 'ACCEPTED'
          ])
        );
        unsubMissions = onSnapshot(q, snap => setActiveMission(!snap.empty));
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
    setStatusError(null);
    
    if (profile?.is_online && activeMission) {
      setStatusError('You cannot go offline while you have an active mission.');
      setTimeout(() => setStatusError(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { is_online: !profile?.is_online, last_active: serverTimestamp() });
    } catch {
      setStatusError('Could not update status. Check your connection.');
      setTimeout(() => setStatusError(null), 3000);
    }
  };

  const isAddressValid = (addr: any) => addr?.name && addr?.phone && addr?.location;

  const calculateRecommendedTip = () => {
    if (!activeService) return null;
    
    let base = activeService.fee || 4.0;
    let sizeSurge = 0;
    let timeSurge = 0;
    let notes = [];

    // Size Surge
    if (activeService.id === 'parcels') {
      if (form.parcelSize?.includes('Medium')) {
        sizeSurge = 1.0;
        notes.push('Medium Size Surge');
      } else if (form.parcelSize?.includes('Large')) {
        sizeSurge = 3.0;
        notes.push('Heavy/Bulky Surge');
      }
    } else if (activeService.id === 'errands') {
      if (form.errandSize?.includes('Bag Size')) {
        sizeSurge = 1.0;
        notes.push('Medium Item Surge');
      } else if (form.errandSize?.includes('Carry-On')) {
        sizeSurge = 2.0;
        notes.push('Large Item Surge');
      }
    }

    // Time Surge (10 PM - 6 AM)
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      timeSurge = 2.0;
      notes.push('Late Night Surge');
    }

    // Default note if no surges applied
    if (notes.length === 0) {
      notes.push('Standard Rate');
    }

    return { total: (base + sizeSurge + timeSurge).toFixed(2), notes };
  };

  const canAdvanceStep = () => {
    if (!activeService) return false;
    const s = activeService.id;
    if (s === 'parcels') {
      if (currentStep === 0 && (!form.parcelSize || !form.parcelVerification)) return false;
      if (currentStep === 1 && !form.pickupNode) return false;
      if (currentStep === 2 && !isAddressValid(form.dropOffAddress)) return false;
    }
    if (s === 'errands') {
      if (currentStep === 0 && (!form.errandBrief || !form.errandSize)) return false;
      if (currentStep === 1 && !isAddressValid(form.errandPickup)) return false;
      if (currentStep === 2 && !isAddressValid(form.errandDropoff)) return false;
    }
    return true;
  };

  const handleFinalizeRequest = async () => {
    if (!auth.currentUser) return router.push('/auth');
    setSubmitting(true);
    try {
      const isParcel = activeService.id === 'parcels';
      const isErrand = activeService.id === 'errands';
      let downloadUrl = '';
      
      if (isParcel && form.parcelImageObj) {
        const storageRef = ref(storage, `parcels/${Date.now()}_${form.parcelImageName}`);
        await uploadBytes(storageRef, form.parcelImageObj);
        downloadUrl = await getDownloadURL(storageRef);
      } else if (isErrand && form.errandImageObj) {
        const storageRef = ref(storage, `errands/${Date.now()}_${form.errandImageName}`);
        await uploadBytes(storageRef, form.errandImageObj);
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
        items_summary: isParcel ? `${form.parcelSize} Parcel (Verify: ${form.parcelVerification})` : `${form.errandSize}: ${form.errandBrief}`,
        attached_file: downloadUrl,
        status: 'PENDING_RUNNER',
        created_at: serverTimestamp()
      });
      router.push(`/run/success?id=${orderRef.id}&type=${activeService.id}`);
    } catch {
      setSubmitError('Could not submit request. Check your connection and try again.');
      setTimeout(() => setSubmitError(null), 4000);
    } finally { setSubmitting(false); }
  };

  // ── STEP CONTENT RENDERER ──
  const renderStep = () => {
    const id = activeService?.id;
    switch (id) {
      case 'parcels':
        if (currentStep === 0) return (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Parcel Size</p>
              <ChipRow activeService={activeService} options={['Small (Fits in bag)', 'Medium (Shoebox)', 'Large (Bulky)']} value={form.parcelSize} onChange={v => setF('parcelSize', v)} />
            </div>
            <Field label="Verification Info" placeholder="e.g. Tracking number or Name on parcel" value={form.parcelVerification} onChange={(v: string) => setF('parcelVerification', v)} />
            <ImageDropzone 
              fileName={form.parcelImageName} 
              onFileSelected={(f) => {
                setF('parcelImageName', f.name);
                setForm((p:any) => ({...p, parcelImageObj: f}));
              }} 
            />
          </div>
        );
        if (currentStep === 1) return <Field label="Where is the parcel?" placeholder="e.g. Main Guard House, Block A Mailroom" value={form.pickupNode} onChange={(v: string) => setF('pickupNode', v)} />;
        if (currentStep === 2) return <DetailedAddressField title="Delivery Address" value={form.dropOffAddress} onChange={(v: any) => setF('dropOffAddress', v)} />;
        if (currentStep === 3) return (
          <div className="space-y-4">
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Your Request Summary</p>
            {[
              { label: 'Parcel Size', value: form.parcelSize || '—' },
              { label: 'Verify With', value: form.parcelVerification || '—' },
              { label: 'Photo', value: form.parcelImageName ? 'Attached' : 'None' },
              { label: 'Pickup', value: form.pickupNode || '—' },
              { label: 'Drop-off', value: form.dropOffAddress.location ? `${form.dropOffAddress.location}` : '—' },
            ].map(r => (
              <div key={r.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50">
                <span className="text-[12px] font-bold text-[#94a3b8] shrink-0">{r.label}</span>
                <span className="text-[13px] font-bold text-slate-900 text-right max-w-[200px]">{r.value}</span>
              </div>
            ))}
          </div>
        );
        break;

      case 'errands':
        if (currentStep === 0) return (
          <div className="space-y-6">
            <Field label="What is the item?" placeholder="e.g. Laptop charger, Room Keys" value={form.errandBrief} onChange={(v: string) => setF('errandBrief', v)} multiline />
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Item Size</p>
              <ChipRow activeService={activeService} options={['Pocket Size (Keys, Wallet)', 'Bag Size (Books, Laptop)', 'Carry-On (Guitar, Poster)']} value={form.errandSize} onChange={v => setF('errandSize', v)} />
            </div>
            <ImageDropzone 
              fileName={form.errandImageName} 
              onFileSelected={(f) => {
                setF('errandImageName', f.name);
                setForm((p:any) => ({...p, errandImageObj: f}));
              }} 
            />
          </div>
        );
        if (currentStep === 1) return <DetailedAddressField title="Pickup Location" value={form.errandPickup} onChange={(v: any) => setF('errandPickup', v)} />;
        if (currentStep === 2) return <DetailedAddressField title="Drop-off Location" value={form.errandDropoff} onChange={(v: any) => setF('errandDropoff', v)} />;
        if (currentStep === 3) return (
          <div className="space-y-4">
            <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Your Request Summary</p>
            {[
              { label: 'Item', value: form.errandBrief ? `${form.errandBrief} (${form.errandSize})` : '—' },
              { label: 'Photo', value: form.errandImageName ? 'Attached' : 'None' },
              { label: 'Pickup', value: form.errandPickup.location ? `${form.errandPickup.location}` : '—' },
              { label: 'Drop-off', value: form.errandDropoff.location ? `${form.errandDropoff.location}` : '—' },
            ].map(r => (
              <div key={r.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50">
                <span className="text-[12px] font-bold text-[#94a3b8] shrink-0">{r.label}</span>
                <span className="text-[13px] font-bold text-slate-900 text-right max-w-[200px]">{r.value}</span>
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
                onClick={() => {
                  if (profile?.is_online) router.push('/run/missions');
                }} 
                disabled={!profile?.is_online}
                className={`w-full flex flex-col items-start gap-4 p-5 rounded-[24px] transition-all shadow-sm ${profile?.is_online ? 'bg-cyan-50 text-cyan-950 active:scale-95' : 'bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${profile?.is_online ? 'bg-cyan-200/70 text-cyan-950' : 'bg-slate-200 text-slate-400'}`}>
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <p className={`text-[14px] font-bold tracking-tight ${profile?.is_online ? '' : 'opacity-70'}`}>Delivery Hub</p>
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
            className="fixed inset-0 z-200 flex flex-col bg-white">

            {/* Wizard nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
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
            <div className="fixed top-[88px] left-0 right-0 h-1 bg-slate-100 z-50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                className={`h-full rounded-r-full ${activeService.themeColor || 'bg-slate-900'}`} />
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
            <div className="px-8 pb-10 pt-6 bg-white border-t-[0.5px] border-slate-100 space-y-6">
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Runner Bounty</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">Set your delivery tip</p>
                    </div>
                    <div className="flex items-center gap-1 border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors pb-1">
                      <span className="text-[18px] font-bold text-slate-400">RM</span>
                      <input 
                        type="number"
                        value={customFee}
                        onChange={(e) => setCustomFee(e.target.value)}
                        className="w-20 text-right text-[26px] font-black text-slate-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* ── Dynamic Pricing Engine UI ── */}
                  {(() => {
                    const rec = calculateRecommendedTip();
                    if (!rec) return null;
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-[16px] flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-bold text-slate-600">💡 Recommended Tip</p>
                          <button onClick={() => setCustomFee(rec.total)} className="text-[11px] font-bold text-emerald-600 bg-emerald-100/70 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                            Apply RM {rec.total}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.notes.map(n => <span key={n} className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-200/50 px-2 py-1 rounded-md">{n}</span>)}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              <button onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleFinalizeRequest()}
                disabled={submitting || !canAdvanceStep()}
                className={`w-full h-16 text-white rounded-[20px] font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:grayscale ${activeService.themeColor || 'bg-slate-900'}`}>
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
