"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where, getDoc } from 'firebase/firestore';
import {
  ChevronLeft, ShieldCheck, Heart, MapPin, 
  Package, Sparkles, CheckCircle2, Star,
  Share2, ShieldAlert
} from 'lucide-react';
import HologramID from '@/components/shared/HologramID';

const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-[#000000] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function PublicProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'users', id as string));
      if (snap.exists()) {
        setProfile(snap.data());
      }
      onSnapshot(query(collection(db, 'items'), where('seller_id', '==', id)), s => {
        setMyListings(s.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    };
    fetchProfile();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#000000] rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">User Not Found</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40 font-sans">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-90 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Public Profile</p>
         </div>
      </nav>

      <div className="pt-28 px-8 space-y-12">
         
         {/* ── PROFILE HEADER ── */}
         <section className="space-y-6">
            <div className="flex items-center gap-6">
               <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                     <img src={profile?.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  {profile?.is_verified_merchant || profile?.role === 'CLUB' ? (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-blue-500 shadow-md">
                       <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-[#94a3b8] shadow-md">
                       <ShieldCheck size={14} />
                    </div>
                  )}
               </div>
               <div className="flex-1 min-w-0 space-y-0.5">
                  <Heading className="truncate">{profile?.full_name || 'Pulse Member'}</Heading>
                  <Subtext>Verified Pulse Account</Subtext>
               </div>
            </div>

            {/* ── PROFILE ACTIONS ── */}
            <div className="flex gap-3">
               <button 
                  onClick={() => {
                     navigator.clipboard.writeText(window.location.href);
                     alert("Profile link copied to clipboard!");
                  }}
                  className="flex-1 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                  <Share2 size={16} /> Share Store
               </button>
               <button 
                  onClick={() => alert("User reported to Campus Governance.")}
                  className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 active:scale-[0.98] transition-all shadow-sm"
               >
                  <ShieldAlert size={18} />
               </button>
            </div>
         </section>

         {/* ── METRICS BAR ── */}
         <section className="flex items-center gap-6 py-4 border-y border-slate-50">
            <button 
               onClick={() => router.push(`/user/${id}/reviews`)}
               className="flex flex-col flex-1 items-center justify-center space-y-1 active:scale-[0.98] transition-all group"
            >
               <div className="flex items-center gap-1.5 text-amber-500">
                 <p className="text-[16px] font-black text-[#000000] group-hover:text-amber-600 transition-colors">
                    {profile?.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'}
                 </p>
                 <Star size={14} fill="currentColor" className="group-hover:text-amber-600 transition-colors" />
               </div>
               <p className="text-[9px] uppercase font-black tracking-widest text-[#94a3b8]">Trust Rating</p>
            </button>

            <div className="w-px h-8 bg-slate-100" />

            <div className="flex flex-col flex-1 items-center justify-center space-y-1">
               <p className="text-[16px] font-black text-[#000000]">{myListings.length}</p>
               <p className="text-[9px] uppercase font-black tracking-widest text-[#94a3b8]">Listings</p>
            </div>
         </section>

         {/* ── STOREFRONT GRID ── */}
         <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1 mb-6">
               <Heading>Storefront</Heading>
            </div>

            {myListings.length === 0 ? (
               <div className="w-full py-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200">
                  <Package size={32} className="text-slate-300 mb-3" />
                  <p className="text-[11px] font-bold text-[#94a3b8] tracking-widest uppercase">No Active Listings</p>
               </div>
            ) : (
               <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                  {myListings.map((item) => (
                     <button 
                        key={item.id} 
                        onClick={() => router.push(`/marketplace/${item.id}`)}
                        className="group flex flex-col text-left active:scale-[0.98] transition-all"
                     >
                        <div className="w-full aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative mb-3">
                           {(item.images?.[0] || item.image_url) ? (
                              <img src={item.images?.[0] || item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200">
                                 <Package size={32} />
                              </div>
                           )}
                           
                           <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-[#000000] tracking-tight">RM {item.price?.toFixed(2)}</p>
                           </div>
                        </div>

                        <div className="px-1 space-y-1 w-full">
                           <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{item.title}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{item.condition || item.status || 'AVAILABLE'}</p>
                        </div>
                     </button>
                  ))}
               </div>
            )}
         </section>
      </div>
    </main>
  );
}
