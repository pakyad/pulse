'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useRouter } from 'next/navigation';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import ProductCard from '@/components/shared/ProductCard';

// ── Fallback Club Merchandise ──────────────────────────────────────────────
const CLUB_FALLBACK = [
  {
    id: 'u1',
    title: 'Badminton Club Official Jersey \'26',
    price: 95,
    category: 'Apparel',
    seller_name: 'BAC UniKL',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'u2',
    title: 'MUET Complete Reference Pack',
    price: 45,
    category: 'Books',
    seller_name: 'MIIT Academic',
    img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'u3',
    title: 'UniKL Campus First Aid Kit',
    price: 38,
    category: 'Medicine',
    seller_name: 'Health & Wellness',
    img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'u4',
    title: 'Calculus & Linear Algebra Textbook',
    price: 60,
    category: 'Books',
    seller_name: 'MIDI Faculty',
    img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'u5',
    title: 'Computer Society Hoodie 2026',
    price: 115,
    category: 'Apparel',
    seller_name: 'CS Club UniKL',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'u6',
    title: 'Paracetamol + Vitamin C Bundle',
    price: 22,
    category: 'Medicine',
    seller_name: 'Health & Wellness',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
  },
];

const CATEGORY_PILLS = ['All', 'Apparel', 'Books', 'Medicine'];

export default function UniStorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
    });

    const q = query(
      collection(db, 'items'),
      where('status', '==', 'active'),
      where('is_official', '==', true),
      orderBy('created_at', 'desc')
    );

    const unsubItems = onSnapshot(q, s => {
      setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => { unsubAuth(); unsubItems(); };
  }, []);

  const liveItems = items.length > 0 ? items : CLUB_FALLBACK;
  const displayed = activeFilter === 'All'
    ? liveItems
    : liveItems.filter(i => i.category === activeFilter);

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <BackButton />
        <div className="flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">UniKL Official</span>
            <h1 className="text-[17px] font-bold text-navy tracking-widest leading-none">UniStore</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-xl">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified</span>
          </div>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'P'} />
        </div>
      </nav>

      <div className="pt-28 px-5 space-y-8">

        {/* ── CATEGORY PILLS ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORY_PILLS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
                activeFilter === cat
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white border border-slate-100 text-slate-400 hover:text-navy'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── PRODUCT GRID ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(n => <div key={n} className="aspect-3/4 bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10">
            {displayed.map((item) => (
              <ProductCard
                key={item.id}
                item={{
                  ...item,
                  image_url: item.image_url || item.img,
                  is_official: true
                }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-[13px] font-bold text-slate-300">No items in this category.</p>
            <button onClick={() => setActiveFilter('All')} className="mt-3 text-[12px] font-bold text-accent">
              View All →
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
