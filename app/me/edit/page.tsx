'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, GraduationCap, MessageSquare, Loader2, ChevronDown, Check } from 'lucide-react';

const MIIT_COURSES = [
  'Bachelor of Software Engineering',
  'Bachelor of Computer Engineering',
  'Bachelor of Networking Systems',
  'Bachelor of Information Technology',
  'Bachelor of Multimedia Technology',
  'Bachelor of Business Computing',
  'Diploma in Software Engineering',
  'Diploma in Information Technology'
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

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [faculty, setFaculty] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // UI State
  const [pickerType, setPickerType] = useState<'avatar' | 'course' | 'year' | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setFaculty(data.faculty || '');
        setYearOfStudy(data.year_of_study || '');
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
        faculty,
        year_of_study: yearOfStudy,
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

  const TitleStyle = "text-[15px] font-bold text-slate-900 tracking-tight";

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-40 font-sans selection:bg-slate-100 antialiased">
      
      {/* ── HEADER ── */}
      <nav className="sticky top-0 z-50 px-6 py-5 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 active:scale-95 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h1 className={TitleStyle}>Edit Profile</h1>
        <div className="w-10" />
      </nav>

      <div className="p-6 space-y-12">
        
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
              <p className={TitleStyle}>{profile?.full_name}</p>
              <p className="text-[11px] font-medium text-slate-400">@{profile?.email?.split('@')[0]}</p>
           </div>
        </section>

        {/* ── ACADEMIC INFO ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-slate-900 px-1">
            <GraduationCap size={18} />
            <label className={TitleStyle}>ACADEMIC INFO</label>
          </div>
          
          <div className="space-y-6">
             {/* MIIT Course Dropdown */}
             <div className="space-y-3">
                <p className={`${TitleStyle} px-1`}>MIIT COURSE</p>
                <div className="relative">
                  <button 
                    onClick={() => setPickerType(pickerType === 'course' ? null : 'course')}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[22px] px-6 flex items-center justify-between active:scale-[0.98] transition-all"
                  >
                    <span className={`text-[14px] font-bold ${faculty ? 'text-slate-900' : 'text-slate-400'}`}>
                       {faculty || 'Select Course'}
                    </span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${pickerType === 'course' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {pickerType === 'course' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-slate-50 border border-slate-100 rounded-[24px] overflow-hidden z-20 shadow-2xl shadow-slate-900/5 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide"
                      >
                        {MIIT_COURSES.map(course => (
                          <button
                            key={course}
                            onClick={() => { setFaculty(course); setPickerType(null); }}
                            className={`w-full px-6 py-4 text-left text-[13px] font-bold transition-colors flex items-center justify-between ${
                              faculty === course ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {course}
                            {faculty === course && <Check size={14} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             </div>

             {/* Current Year Dropdown */}
             <div className="space-y-3">
                <p className={`${TitleStyle} px-1`}>CURRENT YEAR</p>
                <div className="relative">
                  <button 
                    onClick={() => setPickerType(pickerType === 'year' ? null : 'year')}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[22px] px-6 flex items-center justify-between active:scale-[0.98] transition-all"
                  >
                    <span className={`text-[14px] font-bold ${yearOfStudy ? 'text-slate-900' : 'text-slate-400'}`}>
                       {yearOfStudy || 'Select Year'}
                    </span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${pickerType === 'year' ? 'rotate-180' : ''}`} />
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
                            className={`w-full px-6 py-4 text-left text-[13px] font-bold transition-colors flex items-center justify-between ${
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
          <div className="flex items-center gap-3 text-slate-900 px-1">
            <MessageSquare size={18} />
            <label className={TitleStyle}>ABOUT & CONTACT</label>
          </div>
          
          <div className="space-y-3">
             <p className={`${TitleStyle} px-1`}>BIO</p>
             <textarea 
               value={bio}
               onChange={(e) => setBio(e.target.value.slice(0, 150))}
               rows={4}
               className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-[14px] font-medium leading-relaxed outline-none focus:border-slate-900 transition-all resize-none shadow-sm"
               placeholder="Short bio..."
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
