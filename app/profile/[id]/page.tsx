'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Package, MapPin, ExternalLink, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ProductCard from '@/components/shared/ProductCard';

export default function PublicProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);

  useEffect(() => {
    if (!id) return;
    const uid = id as string;

    const load = async () => {
      // Try users collection first (students/sellers), then merchants collection
      let profileSnap = await getDoc(doc(db, 'users', uid));
      let data: any = null;

      if (profileSnap.exists()) {
        data = profileSnap.data();
      } else {
        // Try merchants collection for club accounts
        const merchantSnap = await getDoc(doc(db, 'merchants', uid));
        if (merchantSnap.exists()) data = merchantSnap.data();
      }

      setProfile(data);

      // Fetch their active listings
      const q = query(
        collection(db, 'items'),
        where('seller_id', '==', uid),
        where('is_active', '==', true),
        orderBy('created_at', 'desc')
      );
      try {
        const snap = await getDocs(q);
        setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        // fallback: no ordering if no index
        const q2 = query(collection(db, 'items'), where('seller_id', '==', uid));
        const snap2 = await getDocs(q2);
        setListings(snap2.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(d => d.is_active));
      }

      // Check if this is the current user's own profile
      const current = auth.currentUser;
      if (current?.uid === uid) setIsOwn(true);

      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
        <Package size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-[22px] font-black text-navy tracking-tight">Profile not found</h2>
        <p className="text-[14px] text-slate-400 font-medium mt-2">This account may no longer exist.</p>
      </div>
      <button onClick={() => router.back()} className="px-8 py-4 bg-navy text-white rounded-2xl font-black text-[12px] uppercase tracking-widest">
        Go back
      </button>
    </div>
  );

  const isClub = profile.role === 'CLUB';
  const isSeller = profile.is_seller === true || isClub;
  const displayName = profile.full_name || profile.name || 'Pulse Member';
  const campus = profile.campus || profile.faculty || null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-sans antialiased text-navy">

      {/* BACK BUTTON — floats over header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg flex items-center justify-center text-navy border border-white/60 active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          {isOwn && (
            <button
              onClick={() => router.push('/me')}
              className="px-5 py-2.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg text-[11px] font-black uppercase tracking-widest text-navy border border-white/60 active:scale-95 transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* 1. IDENTITY HEADER */}
      <section className="px-6 pt-32 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-6"
        >
          {/* Avatar */}
          <div className={`shrink-0 w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 shadow-2xl ${isClub ? 'border-accent/30' : 'border-slate-100'}`}>
            <img
              src={profile.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-[24px] font-black text-navy tracking-widest leading-tight truncate">
                {displayName}
              </h1>
              {isClub && (
                <div className="shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-md shadow-accent/20">
                  <ShieldCheck size={13} className="text-white fill-white" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {isClub ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-black text-accent uppercase tracking-widest">
                  <Store size={10} /> Official Club
                </span>
              ) : isSeller ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy/5 border border-navy/10 rounded-full text-[10px] font-black text-navy uppercase tracking-widest">
                  <Package size={10} /> Verified Seller
                </span>
              ) : null}

              {campus && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <MapPin size={11} /> {campus}
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-[13px] font-medium text-slate-400 mt-3 leading-relaxed line-clamp-2">
                {profile.bio}
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats row — for clubs */}
        {isClub && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mt-8"
          >
            {[
              { label: 'Listings', value: listings.length },
              { label: 'Members', value: profile.member_count || '—' },
              { label: 'Sold', value: profile.total_sold || '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-100 rounded-4xl p-5 text-center shadow-sm">
                <p className="text-[22px] font-black text-navy tabular-nums leading-none">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Stats row — for student sellers */}
        {isSeller && !isClub && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mt-8"
          >
            {[
              { label: 'Active Listings', value: listings.length },
              { label: 'Joined', value: profile.created_at ? new Date(profile.created_at?.seconds * 1000 || profile.created_at).getFullYear() : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-100 rounded-4xl p-5 text-center shadow-sm">
                <p className="text-[22px] font-black text-navy tabular-nums leading-none">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-slate-100 mx-6 mb-8" />

      {/* 2. LISTINGS GRID */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-black text-navy tracking-tight">
            {isClub ? 'Club Store' : 'Listings'}
          </h2>
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
            {listings.length} {listings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-4xl flex items-center justify-center text-slate-200 border border-slate-100">
              <Package size={28} strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-medium text-slate-400">No active listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {listings.map((item) => (
              <ProductCard
                key={item.id}
                item={{
                  ...item,
                  seller_name: displayName // Use profile name
                }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
              />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
