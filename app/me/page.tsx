'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Bell, ShieldCheck, Settings,
  Heart, ShoppingBag, Store, Plus,
  MapPin, Edit3, Search, TrendingUp, Wallet,
  BarChart3, ArrowUpRight, Upload, HelpCircle, ChevronRight,
  Eye, Users, Trash2, CheckCircle2,
  X, Info, Sparkles, Footprints, User, LayoutGrid, ClipboardList
} from 'lucide-react';
import { markItemAsSold, deleteItemListing } from '@/lib/marketplace-utils';
import HologramID from '@/components/shared/HologramID';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CreateListing from '@/components/CreateListing';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import ProductCard from '@/components/shared/ProductCard';

// Menu groups for student view
const MENU_GROUPS = [
  {
    label: 'Commerce',
    items: [
      { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Orders', path: '/me/orders' },
      { icon: Store,       color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'My Store', path: '/merchant' },
      { icon: Heart,       color: 'text-rose-500',   bg: 'bg-rose-50',   label: 'Saved Items', path: '/me/saved' },
    ],
  },
];

const DUMMY_LISTINGS = [
  { id: 'd1', title: 'M2 MacBook Air', price: 3200, status: 'ACTIVE', category: 'Tech', views: 842, interests: 45, image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=400' },
  { id: 'd2', title: 'MIIT Official Hoodie', price: 85, status: 'ACTIVE', category: 'Apparel', views: 120, interests: 12, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400' },
];

export default function MePage() {
  const [isIDOpen, setIsIDOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubTrans: (() => void) | null = null;
    let unsubItems: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      if (unsubItems) unsubItems();

      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }

      unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), 
        s => { if (s.exists()) setProfile(s.data()); setLoading(false); },
        err => { console.error("Profile Error:", err); setLoading(false); }
      );

      const nq = query(collection(db, 'orders'), where('buyer_id', '==', currentUser.uid), where('status', 'in', ['PENDING', 'AWAITING_RUNNER', 'IN_TRANSIT']));
      unsubTrans = onSnapshot(nq, s => setNotificationCount(s.docs.length));

      const lq = query(collection(db, 'items'), where('seller_id', '==', currentUser.uid));
      unsubItems = onSnapshot(lq, s => {
        const live = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyListings([...live, ...DUMMY_LISTINGS]);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      if (unsubItems) unsubItems();
    };
  }, []);

  const isSeller = profile?.is_seller === true || profile?.role === 'CLUB';
  const displayName = profile?.full_name || 'Pulse Member';
  const joinYear = profile?.created_at ? new Date(profile.created_at?.seconds * 1000).getFullYear() : 2024;
  const tenure = new Date().getFullYear() - joinYear || 1;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-slate-100 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const MerchantAccountView = () => (
    <div className="space-y-12 pb-32">
      <section className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
          {profile?.photo_url ? (
            <img src={profile.photo_url} className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-slate-300" />
          )}
          <button 
            onClick={() => setIsAvatarSheetOpen(true)}
            className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center group"
          >
            <Edit3 size={16} className="text-white opacity-0 group-hover:opacity-100" />
          </button>
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight">{profile?.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified Seller</span>
            <span className="text-[11px] font-medium text-slate-400">ID: {user?.uid.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400">Manage your profile and account settings.</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
            <button onClick={() => router.push('/me/edit')} className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <Store size={18} className="text-slate-300" />
                <span className="text-[14px] font-bold text-slate-900">Profile</span>
              </div>
              <ChevronRight size={14} className="text-slate-200" />
            </button>
            <button onClick={() => setIsIDOpen(true)} className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <ShieldCheck size={18} className="text-slate-300" />
                <span className="text-[14px] font-bold text-slate-900">Student ID</span>
              </div>
              <ChevronRight size={14} className="text-slate-200" />
            </button>
            <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <Wallet size={18} className="text-slate-300" />
                <span className="text-[14px] font-bold text-slate-900">Payments</span>
              </div>
              <ChevronRight size={14} className="text-slate-200" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400">Set your delivery and collection preferences.</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
            <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <MapPin size={18} className="text-slate-300" />
                <span className="text-[14px] font-bold text-slate-900">Delivery Spots</span>
              </div>
              <ChevronRight size={14} className="text-slate-200" />
            </button>
            <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <Footprints size={18} className="text-slate-300" />
                <span className="text-[14px] font-bold text-slate-900">Runner Settings</span>
              </div>
              <ChevronRight size={14} className="text-slate-200" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full h-16 px-8 flex items-center justify-between hover:bg-rose-50 transition-colors group">
            <div className="flex items-center gap-4">
              <X size={18} className="text-slate-300 group-hover:text-rose-500" />
              <span className="text-[14px] font-bold text-slate-900 group-hover:text-rose-600">Sign Out</span>
            </div>
            <ChevronRight size={14} className="text-slate-200" />
          </button>
        </div>
      </section>

      <section className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
        <h4 className="text-[13px] font-bold text-slate-900 mb-2">Institutional Support</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Access our guides and support for help with your account.</p>
        <button className="w-full h-12 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
          Help Center <ChevronRight size={14} className="text-slate-200" />
        </button>
      </section>
    </div>
  );

  return (
    <>
      <main className="min-h-screen bg-white pb-24 font-sans antialiased text-navy">
        <nav className="fixed top-0 left-0 right-0 z-100 px-6 pt-8 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <button onClick={() => router.push('/home')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-all active:scale-90">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            {profile?.role === 'CLUB' ? (
              <h2 className="text-[16px] font-bold text-slate-900 tracking-tight px-2">Account</h2>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)} 
                className="w-full h-10 bg-slate-50 rounded-2xl flex items-center px-4 gap-3 border border-slate-100/50 shadow-sm"
              >
                <Search size={16} className="text-slate-400" />
                <span className="text-[13px] font-medium text-slate-400">Search Pulse</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/activity')} className="relative p-1 text-slate-300 hover:text-slate-900">
              <Bell size={20} strokeWidth={2.5} />
              {notificationCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
                  {notificationCount}
                </div>
              )}
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={displayName} />
          </div>
        </nav>

        <div className="pt-28 px-6 space-y-12">
          {profile?.role === 'CLUB' ? (
            <MerchantAccountView />
          ) : (
            <>
              <motion.div animate={{ opacity: isCreateOpen ? 0 : 1 }} className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsIDOpen(true)}
                    className="w-[80px] h-[80px] rounded-[28px] overflow-hidden border border-slate-100 bg-white shadow-xl p-1"
                  >
                    <div className="w-full h-full rounded-[22px] overflow-hidden">
                      <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} className="w-full h-full object-cover" />
                    </div>
                  </motion.button>
                  <motion.button
                    onClick={() => setIsAvatarSheetOpen(true)}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-lg"
                  >
                    <Edit3 size={12} strokeWidth={2.5} />
                  </motion.button>
                </div>
                <div className="flex-1 space-y-0.5">
                  <h1 className="text-[26px] font-bold text-slate-900 tracking-[-0.03em] leading-none">{displayName}</h1>
                  <p className="text-[12px] font-medium text-slate-400 tracking-tight">Member since {joinYear || 2024}</p>
                </div>
              </motion.div>

              <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
                <div className="grid grid-cols-3 items-center bg-slate-50/50 rounded-[18px] h-[56px] px-2">
                  <div className="flex flex-col items-center justify-center -space-y-0.5">
                    <span className="text-[15px] font-bold text-slate-900 tracking-tighter">{tenure}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tenure</span>
                  </div>
                  <div className="flex flex-col items-center justify-center -space-y-0.5 border-x border-slate-200/50">
                    <span className="text-[15px] font-bold text-slate-900 tracking-tighter">{myListings.length}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Items</span>
                  </div>
                  <div className="flex flex-col items-center justify-center -space-y-0.5">
                    <span className="text-[15px] font-bold text-slate-900 tracking-tighter">{profile?.trust || 100}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trust</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                  {MENU_GROUPS[0].items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => router.push(item.path)}
                      className="w-full flex items-center justify-between px-8 h-[64px] border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-5">
                        <item.icon size={18} className="text-slate-300" />
                        <span className="text-[15px] font-bold text-slate-900 tracking-[-0.02em]">{item.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-200" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsEnrollmentOpen(true)}
                  className="w-full flex items-center justify-between px-8 h-[72px] bg-white rounded-[32px] border border-slate-100 shadow-xl"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50/50 flex items-center justify-center text-emerald-600">
                      <Footprints size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-bold text-slate-900 tracking-[-0.02em]">Become a Pulse Runner</span>
                  </div>
                  <div className="px-3 py-1 bg-accent/5 text-accent rounded-full text-[9px] font-bold uppercase tracking-[0.15em]">Join</div>
                </button>
              </div>

              <div ref={inventoryRef} className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl px-6 py-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center flex-1">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Views</p>
                      <h3 className="text-[26px] font-bold text-slate-900 tracking-tighter">{myListings.reduce((acc, l) => acc + (l.views || 0), 0)}</h3>
                    </div>
                    <div className="w-px h-8 bg-slate-100 mx-6" />
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leads</p>
                      <h3 className="text-[26px] font-bold text-slate-900 tracking-tighter">{myListings.reduce((acc, l) => acc + (l.interests || 0), 0)}</h3>
                    </div>
                  </div>
                </div>

                <div className="flex bg-slate-50 p-1 rounded-2xl w-44">
                  <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Active</button>
                  <button onClick={() => setActiveTab('sold')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase ${activeTab === 'sold' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Sold</button>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-32">
                  {activeTab === 'active' && (
                    <button onClick={() => setIsCreateOpen(true)} className="aspect-square rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Plus size={24} className="text-slate-300" />
                    </button>
                  )}
                  {myListings
                    .filter(item => activeTab === 'active' ? item.status !== 'SOLD' : item.status === 'SOLD')
                    .map((item) => (
                      <ProductCard key={item.id} item={{ ...item, seller_name: displayName }} onClick={() => router.push(`/marketplace/${item.id}`)} />
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {profile?.role === 'CLUB' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-8 pt-3 px-10 z-300 flex justify-between items-center shadow-sm">
          <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1">
            <LayoutGrid size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">Dashboard</span>
          </button>
          <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1">
            <ClipboardList size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">History</span>
          </button>
          <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1">
            <BarChart3 size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">Insights</span>
          </button>
          <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1">
            <User size={20} className="text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600">Account</span>
          </button>
        </nav>
      )}

      <AnimatePresence>
        {isIDOpen && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsIDOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-sm">
              <HologramID name={profile?.full_name || 'Pulse Member'} role={isSeller ? 'Verified Seller' : 'Student'} matricNo={profile?.matric_no || '—'} qrValue={user?.uid || 'anonymous'} />
              <button onClick={() => setIsIDOpen(false)} className="mt-8 w-full h-14 bg-white/10 rounded-2xl text-white/60 font-bold uppercase text-[11px]">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateOpen && profile && (
          <CreateListing userId={user?.uid || ''} role={profile.role || 'STUDENT'} onClose={() => setIsCreateOpen(false)} />
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <AvatarSelectorSheet 
        isOpen={isAvatarSheetOpen} 
        onClose={() => setIsAvatarSheetOpen(false)}
        currentAvatar={profile?.photo_url}
        onSelect={async (url: string) => {
          if (!user) return;
          await updateDoc(doc(db, 'users', user.uid), { photo_url: url });
          setIsAvatarSheetOpen(false);
        }}
      />
      
      <RunnerEnrollmentSheet 
        isOpen={isEnrollmentOpen} 
        onClose={() => setIsEnrollmentOpen(false)} 
        onComplete={() => {}}
      />
    </>
  );
}

function AvatarSelectorSheet({ isOpen, onClose, currentAvatar, onSelect }: any) {
  const AVATAR_SEEDS = ['Felix', 'Amirul', 'Sarah', 'Danish', 'Iyad', 'Farhan', 'Muhaimizu', 'Ariff', 'Aria'];
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-500 flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative z-10 w-full max-w-lg bg-white rounded-t-[32px] p-8 pb-12">
            <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-8" />
            <h2 className="text-[18px] font-bold text-navy mb-8 text-center">Avatar</h2>
            <div className="grid grid-cols-3 gap-6 mb-10 px-4">
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                return (
                  <button key={seed} onClick={() => onSelect(url)} className={`aspect-square rounded-[24px] overflow-hidden border-2 ${currentAvatar === url ? 'border-blue-500' : 'border-slate-100'}`}>
                    <img src={url} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
            <button className="w-full h-14 bg-slate-50 rounded-[18px] flex items-center justify-center gap-3 text-[13px] font-bold text-navy">
              <Upload size={16} /> Upload from Gallery
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
