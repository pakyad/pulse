'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';


const FACULTIES = ['MIIT', 'FBT', 'FST', 'FBEST', 'FIS', 'IFP'];
const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgrad'];

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [faculty, setFaculty] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteSpot, setFavoriteSpot] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // UI State
  const [pickerType, setPickerType] = useState<'faculty' | 'year' | null>(null);

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
        setFavoriteSpot(data.favorite_spot || '');
        setPhoneNumber(data.phone_number || '');
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
        favorite_spot: favoriteSpot,
        phone_number: phoneNumber,
      });
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-navy">
      
      {/* ── HEADER (Apple Standard) ── */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
        <BackButton />
        <h1 className="text-[17px] font-bold tracking-tight">Edit Profile</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`text-[14px] font-bold transition-all active:scale-95 ${
            saving ? 'text-slate-300' : 'text-blue-500'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="px-6 pt-4 space-y-10">
        
        {/* ── SECTION 1: ACADEMIC IDENTITY (The Slim Stack) ── */}
        <section className="space-y-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Academic Identity</p>
          <div className="space-y-2">
            <SelectionRow 
              label="Faculty" 
              value={faculty || 'Select'} 
              onClick={() => setPickerType('faculty')} 
            />
            <SelectionRow 
              label="Year of Study" 
              value={yearOfStudy || 'Select'} 
              onClick={() => setPickerType('year')} 
            />
          </div>
        </section>

        {/* ── SECTION 2: PROFILE DETAILS (Content-First) ── */}
        <section className="space-y-6 pt-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Profile Details</p>
          
          <div className="space-y-8">
            {/* Bio (Hairline Input) */}
            <div className="relative">
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Brief bio..."
                className="w-full bg-transparent border-b border-[#E5E5EA] focus:border-navy py-2 text-[14px] font-medium outline-none transition-colors resize-none h-10 overflow-hidden"
                rows={1}
              />
              <span className="absolute bottom-[-18px] right-0 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                {bio.length}/150
              </span>
            </div>

            {/* Favorite Spot (Hairline Input) */}
            <div className="relative">
              <input 
                type="text"
                value={favoriteSpot}
                onChange={(e) => setFavoriteSpot(e.target.value)}
                placeholder="Favorite campus spot..."
                className="w-full bg-transparent border-b border-[#E5E5EA] focus:border-navy py-2 text-[14px] font-medium outline-none transition-colors"
              />
            </div>

            {/* Phone Number (Hairline Input) */}
            <div className="relative">
              <input 
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full bg-transparent border-b border-[#E5E5EA] focus:border-navy py-2 text-[14px] font-medium outline-none transition-colors"
              />
            </div>
          </div>
        </section>

      </div>

      {/* ── OPTICAL PICKERS ── */}
      <AnimatePresence>
        {pickerType && (
          <div className="fixed inset-0 z-100 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPickerType(null)}
              className="absolute inset-0 bg-black/5" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-t-[24px] p-6 pb-12 border-t border-[#F2F2F7]"
            >
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6" />
              <h2 className="text-[14px] font-bold text-navy mb-4 text-center">
                Select {pickerType === 'faculty' ? 'Faculty' : 'Year'}
              </h2>
              <div className="space-y-1">
                {(pickerType === 'faculty' ? FACULTIES : YEARS).map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (pickerType === 'faculty') setFaculty(opt);
                      else setYearOfStudy(opt);
                      setPickerType(null);
                    }}
                    className="w-full flex items-center justify-between py-4 px-4 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[14px] font-medium text-navy">{opt}</span>
                    {(pickerType === 'faculty' ? faculty : yearOfStudy) === opt && (
                      <Check size={16} className="text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

function SelectionRow({ label, value, onClick }: { label: string, value: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full h-[44px] bg-[#F9F9FB] rounded-[12px] px-4 flex items-center justify-between active:scale-[0.98] transition-all"
    >
      <span className="text-[13px] font-medium text-navy">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-normal text-slate-400">{value}</span>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </button>
  );
}
