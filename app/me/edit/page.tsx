'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Camera, User } from 'lucide-react';

const AVATAR_SEEDS = [
  'Felix', 'Amirul', 'Sarah', 'Danish', 'Iyad', 'Farhan', 'Muhaimizu', 'Ariff',
  'Aria', 'Leo', 'Milo', 'Luna', 'Oscar', 'Ruby', 'Zoe', 'Max'
];

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setFullName(data.full_name || '');
        setSelectedAvatar(data.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.full_name}`);
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
        full_name: fullName,
        photo_url: selectedAvatar
      });
      router.back();
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
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
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy max-w-md mx-auto border-x border-slate-50 shadow-sm">
      
      {/* HEADER */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-300 hover:text-navy transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">Edit Profile</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`text-[15px] font-bold ${saving ? 'text-slate-300' : 'text-blue-500 hover:text-blue-600'} transition-colors`}
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </header>

      <div className="p-6 space-y-10">
        
        {/* CURRENT AVATAR PREVIEW */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50 transition-transform active:scale-95 cursor-pointer">
              <img src={selectedAvatar} className="w-full h-full object-cover" alt="Preview" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white text-white">
              <Camera size={18} />
            </div>
          </div>
          <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Profile Identity</p>
        </div>

        {/* AVATAR GALLERY */}
        <section>
          <h3 className="text-[12px] font-black text-slate-300 uppercase tracking-widest mb-4 ml-1">Avatar Gallery</h3>
          <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm">
            {AVATAR_SEEDS.map((seed) => {
              const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
              const isSelected = selectedAvatar === url;
              return (
                <button
                  key={seed}
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all active:scale-90 ${
                    isSelected ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt={seed} />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                      <div className="bg-blue-500 text-white rounded-full p-0.5">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-3 px-2 text-center leading-relaxed">
            Choose a unique visual identifier for the Pulse marketplace.
          </p>
        </section>

        {/* INFO SECTION */}
        <section className="space-y-4">
          <h3 className="text-[12px] font-black text-slate-300 uppercase tracking-widest ml-1">Personal Info</h3>
          <div className="bg-white rounded-[2rem] border border-slate-50 shadow-sm overflow-hidden">
             <div className="p-5 space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Full Name</label>
                <input 
                   type="text" 
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="Enter your name"
                   className="w-full text-[16px] font-bold text-navy outline-none bg-transparent placeholder:text-slate-200"
                />
             </div>
             <div className="p-5 border-t border-slate-50 space-y-1">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Matric Number</label>
                <p className="text-[16px] font-bold text-slate-300">{profile?.matric_no || '—'}</p>
             </div>
          </div>
        </section>

      </div>

    </main>
  );
}
