'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, Loader2, ChevronDown, Check, Lock } from 'lucide-react';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const PROGRAMMES_GROUPS = [
  {
    label: 'Pre-University & Foundation',
    options: [
      'Foundation in Computer Technology (FICT)',
      'Foundation in Science and Technology (Pre-Korea Program)',
    ]
  },
  {
    label: 'Diploma',
    options: [
      'Diploma in Information Technology',
      'Diploma in Networking Technology',
      'Diploma in Multimedia',
      'Diploma in Animation',
    ]
  },
  {
    label: 'Bachelor — Software Engineering & IT',
    options: [
      'Bachelor of IT (Hons) in Software Engineering',
      'Bachelor of IT (Hons) in Computer System Security',
      'Bachelor of IT (Hons) in Internet of Things',
      'Bachelor of Artificial Intelligence Technology with Honours',
    ]
  },
  {
    label: 'Bachelor — Creative Multimedia',
    options: [
      'Bachelor of Multimedia Technology (Hons) in Interactive Multimedia Design',
      'Bachelor of Multimedia Technology (Hons) in Computer Animation',
      'Bachelor of Game Development Technology with Honours',
    ]
  },
  {
    label: 'Bachelor — Computer Engineering',
    options: [
      'Bachelor of Computer Engineering Technology (Networking Systems) with Honours',
      'Bachelor of Computer Engineering Technology (Computer Systems) with Honours',
    ]
  },
  {
    label: 'Postgraduate',
    options: [
      'Master in Computer Science',
      'Master of Information Technology',
      'Master in Creative Digital Media',
      'Doctor of Philosophy (Information Technology)',
    ]
  }
];

const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgrad'];

const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Human' },
  { id: 'notionists', label: 'Elegant' },
  { id: 'open-peeps', label: 'Friendly' },
  { id: 'personas', label: 'Stylized' },
  { id: 'bottts', label: 'Robot' },
  { id: 'miniavs', label: 'Minimal' },
  { id: 'lorelei', label: 'Artistic' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'shapes', label: 'Abstract' },
  { id: 'initials', label: 'Formal' }
];

// ── STANDARDIZED TYPOGRAPHY COMPONENTS (From Me Page) ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [programme, setProgramme] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [campus, setCampus] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // UI State
  const [pickerType, setPickerType] = useState<'avatar' | 'programme' | 'year' | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setProgramme(data.programme || data.faculty || '');
        setMatricNumber(data.matricNumber || data.matric_no || '');
        setCampus(data.campus || '');
        setYearOfStudy(data.yearOfStudy || data.year_of_study || '');
        setBio(data.bio || '');
        setPhotoUrl(data.photo_url || '');
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        programme,
        matricNumber,
        campus: 'MIIT',
        yearOfStudy,
        year_of_study: yearOfStudy,
        faculty: programme,
        bio,
        photo_url: photoUrl,
      });
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const selectAvatar = (style: string) => {
    const params = style === 'initials' ? '' : '&mouth=smile,default&eyebrows=default&eyes=default';
    const newUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${profile?.full_name || 'Pulse'}${params}`;
    setPhotoUrl(newUrl);
    setPickerType(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-40 font-sans selection:bg-slate-100 antialiased">
      
      {/* ── LOCAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Edit Profile</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 p-6 space-y-12">
        
        {/* ── AVATAR PICKER ── */}
        <section className="flex flex-col items-center justify-center space-y-4">
           <button 
             onClick={() => setPickerType('avatar')}
             className="relative group active:scale-95 transition-all"
           >
              <div className="w-24 h-24 rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:border-slate-300 transition-colors">
                 <img src={photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" alt="Profile" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">
                 <Camera size={14} />
              </div>
           </button>
           <div className="text-center space-y-1">
              <Heading>{profile?.full_name}</Heading>
              <Subtext>@{profile?.email?.split('@')[0]}</Subtext>
           </div>
        </section>

        {/* ── ACADEMIC INFO ── */}
        <section className="space-y-6">
          <div className="px-1 space-y-1">
            <Heading>Academic Details</Heading>
            <Subtext>Update your course and year of study</Subtext>
          </div>
          
           <div className="space-y-4">
              {/* Programme Dropdown */}
              <div className="space-y-2">
                 <p className="text-[12px] font-semibold text-slate-500 capitalize px-1">Programme</p>
                 <div className="relative">
                   <button 
                     onClick={() => setPickerType(pickerType === 'programme' ? null : 'programme')}
                     className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-5 flex items-center justify-between active:scale-[0.98] transition-all"
                   >
                     <span className={`text-[13px] font-bold ${programme ? 'text-slate-900' : 'text-slate-400'}`}>
                        {programme || 'Select Programme'}
                     </span>
                     <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${pickerType === 'programme' ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {pickerType === 'programme' && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                         className="absolute top-full left-0 right-0 mt-3 bg-slate-50 border border-slate-100 rounded-[24px] overflow-hidden z-20 shadow-2xl shadow-slate-900/5 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide"
                       >
                         {PROGRAMMES_GROUPS.map(group => (
                           <div key={group.label}>
                             <p className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/80 sticky top-0">
                               {group.label}
                             </p>
                             {group.options.map(opt => (
                               <button
                                 key={opt}
                                 onClick={() => { setProgramme(opt); setPickerType(null); }}
                                 className={`w-full px-6 py-4 text-left text-[12px] font-bold transition-colors flex items-center justify-between ${
                                   programme === opt ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                                 }`}
                               >
                                 {opt}
                                 {programme === opt && <Check size={14} />}
                               </button>
                             ))}
                           </div>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>

              {/* Matric Number */}
              <div className="space-y-2">
                 <p className="text-[12px] font-semibold text-slate-500 capitalize px-1">Matric Number</p>
                 <input
                   type="text"
                   placeholder="e.g. MIIT2210234"
                   value={matricNumber}
                   onChange={(e) => setMatricNumber(e.target.value)}
                   className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-5 text-[13px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
                 />
              </div>

              {/* Campus (read-only) */}
              <div className="space-y-2">
                 <p className="text-[12px] font-semibold text-slate-500 capitalize px-1">Campus</p>
                 <div className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-5 flex items-center justify-between">
                   <span className="text-[13px] font-bold text-slate-600">MIIT — Malaysian Institute of Information Technology</span>
                   <Lock size={16} className="text-slate-400 shrink-0" />
                 </div>
              </div>

              {/* Current Year Dropdown */}
              <div className="space-y-2">
                 <p className="text-[12px] font-semibold text-slate-500 capitalize px-1">Current Year</p>
                 <div className="relative">
                   <button 
                     onClick={() => setPickerType(pickerType === 'year' ? null : 'year')}
                     className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-5 flex items-center justify-between active:scale-[0.98] transition-all"
                   >
                     <span className={`text-[13px] font-bold ${yearOfStudy ? 'text-slate-900' : 'text-slate-400'}`}>
                        {yearOfStudy || 'Select Year'}
                     </span>
                     <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${pickerType === 'year' ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {pickerType === 'year' && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                         className="absolute top-full left-0 right-0 mt-3 bg-slate-50 border border-slate-100 rounded-[24px] overflow-hidden z-20 shadow-2xl shadow-slate-900/5"
                       >
                         {YEARS.map(year => (
                           <button
                             key={year}
                             onClick={() => { setYearOfStudy(year); setPickerType(null); }}
                             className={`w-full px-6 py-4 text-left text-[12px] font-bold transition-colors flex items-center justify-between ${
                               yearOfStudy === year ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                             }`}
                           >
                             {year}
                             {yearOfStudy === year && <Check size={14} />}
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
           </div>
        </section>

        {/* ── ABOUT & CONTACT ── */}
        <section className="space-y-6">
          <div className="px-1 space-y-1">
            <Heading>Public Profile</Heading>
            <Subtext>Tell peers about yourself</Subtext>
          </div>
          
          <div className="space-y-2">
             <p className="text-[12px] font-semibold text-slate-500 capitalize px-1">Short Bio</p>
             <textarea 
               value={bio}
               onChange={(e) => setBio(e.target.value.slice(0, 150))}
               rows={4}
               className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-5 text-[14px] font-medium leading-relaxed outline-none focus:border-slate-900 transition-all resize-none shadow-sm"
               placeholder="Write something about yourself..."
             />
             <p className="text-right text-[9px] font-bold text-slate-300 px-2 tracking-tighter">{bio.length}/150</p>
          </div>
        </section>

      </div>

      {/* ── STICKY FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full h-14 bg-slate-900 text-white rounded-full text-[14px] font-bold disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-md"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
        </button>
      </footer>

      {/* ── AVATAR MODAL ── */}
      <AnimatePresence>
        {pickerType === 'avatar' && (
          <div className="fixed inset-0 z-100 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPickerType(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative z-10 w-full bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              
              <div className="space-y-4">
                <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Profile Style</p>

                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {AVATAR_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => selectAvatar(style.id)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 text-left"
                    >
                      <img 
                        src={`https://api.dicebear.com/7.x/${style.id}/svg?seed=${profile?.full_name || 'Pulse'}&mouth=smile,default`} 
                        className="w-10 h-10 rounded-xl bg-white"
                        alt={style.label}
                      />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
