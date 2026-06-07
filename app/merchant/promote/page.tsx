"use client";

import { Suspense, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, orderBy } from 'firebase/firestore';
import { 
  Building2, Zap, TrendingUp, Search, LayoutDashboard, CheckCircle2, 
  Clock, XCircle, ChevronRight, ArrowLeft, Image as ImageIcon, Sparkles,
  Info, BarChart3, AlertCircle
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useSearchParams } from 'next/navigation';

function PromoteHubContent() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [studioStep, setStudioStep] = useState<0 | 1 | 1.5 | 1.7 | 2 | 3>(0); // 0 is Hub, 1-3 is Studio
  const router = useRouter();
  const searchParams = useSearchParams();

  // STUDIO DRAFT
  const [draft, setDraft] = useState({
    template_id: 'overture',
    item_id: '',
    headline: '',
    caption: '',
    cta: 'Sync Now',
    image_url: '',
    campus: '',
    schedule_slot: ''
  });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        const data = uSnap.data();
        setMerchant(data);
        
        // INSTITUTIONAL FIREWALL: Only CLUBS or Admins can promote
        const isClub = data?.role === 'CLUB' || data?.merchant_type === 'CLUB';
        const isTester = user.email === 'testclub@pulse.com';
        
        if (!isClub && data?.role !== 'ADMIN' && !isTester) {
           router.push('/merchant'); // Restricted access
        }
      } else {
        router.push('/auth');
      }
    });

    // Fetch Assets for selection
    const qAssets = query(collection(db, "items"), where("merchant_id", "==", auth.currentUser?.uid));
    const unsubAssets = onSnapshot(qAssets, (sn) => {
       setAssets(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Campaigns
    const qCamps = query(
      collection(db, "campaigns"), 
      where("merchant_id", "==", auth.currentUser?.uid),
      orderBy("created_at", "desc")
    );
    const unsubCamps = onSnapshot(qCamps, (sn) => {
       setCampaigns(sn.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    });

    return () => { unsubAuth(); unsubAssets(); unsubCamps(); };
  }, []);

  // Handle direct boost from inventory
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId && assets.length > 0) {
      const asset = assets.find(a => a.id === itemId);
      if (asset) {
        setDraft(prev => ({ 
          ...prev, 
          item_id: itemId, 
          headline: asset.title,
          image_url: asset.image_url 
        }));
        setStudioStep(1); // Start the flow
      }
    }
  }, [searchParams, assets]);

  // TOKEN QUOTA CALCULATION (Barrier Logic)
  const tokensRemaining = useMemo(() => {
    const today = Date.now() - (24 * 60 * 60 * 1000);
    const recent = campaigns.filter(c => c.created_at > today);
    const used = recent.reduce((acc, c) => {
       if (c.template_id === 'overture') return acc + 3;
       if (c.template_id === 'spotlight') return acc + 2;
       return acc + 1;
    }, 0);
    return Math.max(0, 3 - used);
  }, [campaigns]);

  const handleLaunch = async () => {
    if (tokensRemaining <= 0) {
      setLaunchError('Daily quota exceeded. Tokens reset every 24 hours.');
      setTimeout(() => setLaunchError(null), 4000);
      return;
    }
    const selectedAsset = assets.find(a => a.id === draft.item_id);
    
    await addDoc(collection(db, "campaigns"), {
      merchant_id: auth.currentUser?.uid,
      item_id: draft.item_id,
      template_id: draft.template_id,
      status: 'pending',
      campus: draft.campus,
      schedule_slot: draft.schedule_slot,
      created_at: Date.now(),
      creative: {
        headline: draft.headline || selectedAsset?.title,
        caption: draft.caption || selectedAsset?.description,
        cta_text: draft.cta,
        image_url: draft.image_url || selectedAsset?.image_url
      },
      expires_at: Date.now() + (48 * 60 * 60 * 1000)
    });

    setLaunchSuccess(true);
    setStudioStep(0);
    setTimeout(() => setLaunchSuccess(false), 4000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-40 font-sans antialiased text-navy">
      
      {/* 1. HUB HEADER */}
      <section className="px-6 pt-16 pb-8 border-b border-slate-50 sticky top-0 bg-white z-50">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <BackButton fallback="/merchant" />
              <div>
                 <h1 className="text-[24px] font-bold tracking-widest text-navy">Promotion Center</h1>
                 <p className="text-[11px] font-bold text-slate-300  leading-none mt-1">Boost your items to the front page</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0A1121] rounded-2xl border border-white/10 shadow-md shadow-navy/20">
              <Sparkles size={14} className="text-accent" />
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-white/40  leading-none">Prestige Tokens</span>
                 <span className="text-[13px] font-bold text-white leading-none mt-0.5">{tokensRemaining} / 3</span>
              </div>
           </div>
        </div>
      </section>

      {/*  IN-UI FEEDBACK TOASTS  */}
      {launchError && (
        <div className="fixed top-24 left-6 right-6 z-200 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md">
          {launchError}
        </div>
      )}
      {launchSuccess && (
        <div className="fixed top-24 left-6 right-6 z-200 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-[12px] font-bold shadow-md">
           Campaign transmitted to Pulse Command for review.
        </div>
      )}

      {/* HUB CONTENT (THE LEDGER) */}
      {studioStep === 0 && (
         <section className="px-6 py-10 space-y-12">
            
            {/* HERO CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <motion.button 
                 whileTap={{ scale: 0.98 }}
                 onClick={() => setStudioStep(1)}
                 disabled={tokensRemaining <= 0}
                 className={`p-10 rounded-[3rem] text-left relative overflow-hidden group transition-all
                   ${tokensRemaining > 0 ? 'bg-navy shadow-md shadow-navy/20' : 'bg-slate-100'}`}
               >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,transparent_70%)] opacity-30" />
                  <div className="relative z-10 space-y-6">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${tokensRemaining > 0 ? 'bg-white/10 text-white' : 'bg-white text-slate-200'}`}>
                        <Zap size={24} className={tokensRemaining > 0 ? "fill-white" : ""} />
                     </div>
                      <div>
                         <h3 className={`text-[20px] font-bold tracking-widest mb-2 ${tokensRemaining > 0 ? 'text-white' : 'text-slate-400'}`}>Boost an Item</h3>
                         <p className={`text-[13px] font-medium leading-relaxed ${tokensRemaining > 0 ? 'text-white/40' : 'text-slate-300'}`}>Put your items at the top of the home page so every student sees them.</p>
                      </div>
                  </div>
               </motion.button>
               
               <div className="p-10 rounded-[3rem] bg-white border border-slate-100 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                       <BarChart3 size={20} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-300 ">Aggregate Impact</p>
                  </div>
                  <h3 className="text-[32px] font-bold text-navy tracking-tighter">0.0<span className="text-[14px] text-slate-200 ml-1">Reach Alpha</span></h3>
               </div>
            </div>

            {/* SYNC LEDGER */}
            <div className="space-y-6">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[14px] font-bold text-navy tracking-tight">Active Pulse Registry</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 ">Live Sync</span>
                  </div>
               </div>

               {campaigns.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem]">
                     <p className="text-[13px] font-bold text-slate-300 ">Institutional Hub Clean</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {campaigns.map((camp) => (
                        <div 
                          key={camp.id} 
                          className="bg-white border border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-navy/10 transition-all shadow-sm"
                        >
                           <div className="flex items-center gap-6">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${camp.status === 'active' ? 'bg-emerald-50 text-emerald-500' : camp.status === 'pending' ? 'bg-blue-50 text-slate-900' : 'bg-red-50 text-red-500'}`}>
                                 {camp.status === 'active' ? <CheckCircle2 size={20} /> : camp.status === 'pending' ? <Clock size={20} /> : <XCircle size={20} />}
                              </div>
                              <div>
                                 <h4 className="text-[16px] font-bold text-navy mb-0.5 tracking-widest line-clamp-1">{camp.creative?.headline}</h4>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold uppercase text-slate-300 tracking-widest">{camp.template_id}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-100" />
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase
                                      ${camp.status === 'active' ? 'bg-emerald-100 text-emerald-600' : camp.status === 'pending' ? 'bg-blue-100 text-slate-900' : 'bg-red-100 text-red-600'}`}
                                    >
                                       {camp.status}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           <ChevronRight size={18} className="text-slate-100 group-hover:text-navy transition-all" />
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </section>
      )}

      {/* 4. THE STUDIO (FULL SCREEN WIZARD) */}
      <AnimatePresence>
        {studioStep > 0 && (
           <motion.section 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
             className="px-6 py-10"
           >
              <div className="max-w-4xl mx-auto space-y-12">
                 
                 {/* STEP 1: ASSET SELECTION */}
                 {studioStep === 1 && (
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <h2 className="text-[28px] font-bold tracking-tight">Institutional Scoping</h2>
                          <p className="text-slate-400 text-sm max-w-sm">Select the campus target for this campaign. Prestige tools are locked to the Trinity network.</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'MIIT', name: 'UniKL MIIT', sub: 'Informatics & Tech' },
                            { id: 'UBIS', name: 'UniKL UBIS', sub: 'Business School' },
                            { id: 'MIDI', name: 'UniKL MIDI', sub: 'Design Institute' }
                          ].map(campus => (
                             <button 
                               key={campus.id}
                               onClick={() => { setDraft({ ...draft, campus: campus.id }); setStudioStep(1.5 as any); }}
                               className={`p-10 bg-white border rounded-[3rem] text-left transition-all active:scale-95 shadow-sm
                                 ${draft.campus === campus.id ? 'border-navy bg-navy text-white shadow-md shadow-navy/20' : 'border-slate-100'}`}
                             >
                                <h4 className="text-[18px] font-bold mb-1">{campus.name}</h4>
                                <p className={`text-[10px] font-bold  ${draft.campus === campus.id ? 'text-white/40' : 'text-slate-300'}`}>{campus.sub}</p>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* STEP 1.5: SCHEDULING SLOT */}
                 {studioStep === 1.5 && (
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <h2 className="text-[28px] font-bold tracking-tight">Transmission Slot</h2>
                          <p className="text-slate-400 text-sm max-w-sm">Pulse staggered scheduling ensures high visibility. Overbooking is restricted.</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'morning_pulse', name: 'Morning Pulse', time: '08:00 - 12:00' },
                            { id: 'evening_sync', name: 'Evening Sync', time: '16:00 - 20:00' }
                          ].map(slot => (
                             <button 
                               key={slot.id}
                               onClick={() => { setDraft({ ...draft, schedule_slot: slot.id }); setStudioStep(1.7 as any); }}
                               className={`p-10 bg-white border rounded-[3rem] text-left transition-all active:scale-95
                                 ${draft.schedule_slot === slot.id ? 'border-navy bg-navy text-white shadow-md shadow-navy/10' : 'border-slate-100'}`}
                             >
                                <h4 className="text-[18px] font-bold mb-1">{slot.name}</h4>
                                <p className={`text-[11px] font-medium ${draft.schedule_slot === slot.id ? 'text-white/40' : 'text-slate-400'}`}>{slot.time} GMT+8</p>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* STEP 1.7: ASSET SELECTION */}
                 {studioStep === 1.7 && (
                    <div className="space-y-10">
                       <div className="space-y-2">
                          <h2 className="text-[28px] font-bold tracking-tight">Select Targeted Asset</h2>
                          <p className="text-slate-400 text-sm max-w-sm">Choose an existing item from your inventory to launch into the Pulse network.</p>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {assets.map(asset => (
                             <button 
                               key={asset.id}
                               onClick={() => { setDraft({ ...draft, item_id: asset.id, headline: asset.title }); setStudioStep(2); }}
                               className={`p-6 bg-white border rounded-[2.5rem] text-left transition-all group overflow-hidden
                                 ${draft.item_id === asset.id ? 'border-navy shadow-md shadow-navy/10' : 'border-slate-100'}`}
                             >
                                <img src={asset.image_url} className="w-full aspect-square object-cover rounded-2xl mb-4 grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                <h4 className="text-[14px] font-bold line-clamp-1">{asset.title}</h4>
                                <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">RM {asset.price.toFixed(2)}</p>
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* STEP 2: OBJECTIVE & CREATIVE */}
                 {studioStep === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                       <div className="space-y-10">
                           <div className="space-y-2">
                              <h2 className="text-[28px] font-bold tracking-tight">Design your Boost</h2>
                              <p className="text-slate-400 text-sm">Write a catchy headline and description for your ad.</p>
                           </div>
                          
                          <div className="space-y-8">
                             {/* Objective Select */}
                             <div className="space-y-4">
                                <p className="text-[11px] font-bold text-slate-300 ">Select Objective</p>
                                <div className="grid grid-cols-3 gap-3">
                                   {[
                                     { id: 'overture', icon: LayoutDashboard, cost: 3 },
                                     { id: 'spotlight', icon: Search, cost: 2 },
                                     { id: 'blast', icon: Zap, cost: 1 },
                                   ].map(t => (
                                      <button 
                                        key={t.id}
                                        onClick={() => setDraft({ ...draft, template_id: t.id, cta: 'Sync Listing' })}
                                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${draft.template_id === t.id ? 'bg-navy border-navy text-white shadow-md shadow-navy/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                      >
                                         <t.icon size={20} />
                                         <p className="text-[9px] font-semibold">{t.id}</p>
                                         <div className="text-[8px] opacity-40">Cost: {t.cost}T</div>
                                      </button>
                                   ))}
                                </div>
                             </div>

                             {/* Creative Forms */}
                             <div className="space-y-6">
                                <div className="space-y-2">
                                   <p className="text-[10px] font-bold text-slate-300  ml-1">Campaign Headline</p>
                                   <input value={draft.headline} onChange={e => setDraft({ ...draft, headline: e.target.value })} className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-navy outline-none focus:border-navy transition-all" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-[10px] font-bold text-slate-300  ml-1">Creative Caption</p>
                                   <textarea value={draft.caption} onChange={e => setDraft({ ...draft, caption: e.target.value })} className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-bold text-navy outline-none focus:border-navy transition-all resize-none" />
                                </div>
                             </div>
                             
                             {/* Action Selector */}
                             <div className="space-y-4">
                                <p className="text-[11px] font-bold text-slate-300 ">Action Protocol</p>
                                <div className="grid grid-cols-2 gap-3">
                                   {[
                                     { id: 'in_app', name: 'In-App Sync', sub: 'Sync Listing' },
                                     { id: 'whatsapp', name: 'External Handshake', sub: 'WhatsApp Rep' },
                                   ].map(a => (
                                      <button 
                                        key={a.id}
                                        onClick={() => setDraft({ ...draft, cta: a.sub })}
                                        className={`flex flex-col p-5 rounded-2xl border transition-all text-left ${draft.cta === a.sub ? 'bg-navy border-navy text-white shadow-md shadow-navy/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                      >
                                         <p className="text-[11px] font-bold leading-none mb-1">{a.name}</p>
                                         <p className="text-[9px] font-medium opacity-50 ">{a.sub}</p>
                                      </button>
                                   ))}
                                </div>
                             </div>
                             
                             <button 
                               onClick={() => setStudioStep(3)}
                               className="w-full py-6 bg-navy text-white rounded-4xl font-bold  text-[13px] shadow-md shadow-navy/20 active:scale-95 transition-all"
                             >
                                Review Final Sync
                             </button>
                          </div>
                       </div>

                       {/* LIVE PREVIEW SIDEBAR */}
                       <div className="hidden lg:block relative pt-12">
                          <div className="sticky top-40 space-y-8">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <p className="text-[11px] font-bold text-slate-300 ">Prestige Live Preview</p>
                             </div>
                             
                             {/* THE PHONE MOCKUP */}
                             <div className="w-full max-w-[320px] aspect-9/17 bg-[#0A1121] rounded-[4rem] p-6 relative overflow-hidden border-8 border-slate-900 shadow-md">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,transparent_70%)] opacity-30" />
                                <div className="relative z-10 space-y-6 pt-10">
                                   <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                                      <p className="text-[8px] font-bold text-white ">{draft.template_id}</p>
                                   </div>
                                   
                                   {/* CAMPAIGN CARD PEEK */}
                                   <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                      <h4 className="text-white text-[18px] font-bold leading-tight">{draft.headline || 'Your Headline'}</h4>
                                      <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{draft.caption || 'Your brand story here...'}</p>
                                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                         <span className="text-white font-bold text-sm">RM --.--</span>
                                         <div className="px-3 py-1.5 bg-accent text-white text-[9px] font-bold rounded-lg">{draft.cta}</div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* STEP 3: FINAL REVIEW */}
                 {studioStep === 3 && (
                    <div className="py-20 text-center space-y-12">
                       <div className="max-w-md mx-auto space-y-6">
                          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                             <CheckCircle2 size={40} />
                          </div>
                          <h2 className="text-[32px] font-bold tracking-widest text-navy">Ready for Authorization?</h2>
                          <div className="p-8 bg-slate-50 rounded-[3rem] text-left space-y-4 border border-slate-100">
                             <div className="flex justify-between items-center">
                                <p className="text-[11px] font-bold text-slate-300 ">Protocol Sync</p>
                                <p className="text-[13px] font-bold text-navy">{draft.template_id.toUpperCase()}</p>
                             </div>
                             <div className="flex justify-between items-center">
                                <p className="text-[11px] font-bold text-slate-300 ">Token Investment</p>
                                <p className="text-[13px] font-bold text-accent">-{draft.template_id === 'overture' ? 3 : draft.template_id === 'spotlight' ? 2 : 1} TOKENS</p>
                             </div>
                             <div className="flex justify-between items-center">
                                <p className="text-[11px] font-bold text-slate-300 ">Estimated Reach</p>
                                <p className="text-[13px] font-bold text-navy">850-1,200 Pulse Nodes</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-center gap-4">
                          <button onClick={handleLaunch} className="w-64 py-6 bg-navy text-white rounded-full font-bold shadow-md shadow-navy/20 active:scale-95 transition-all">Synchronize Campaign</button>
                          <button onClick={() => setStudioStep(2)} className="text-[13px] font-bold text-slate-300 hover:text-navy transition-colors">Return to Studio</button>
                       </div>
                    </div>
                 )}

              </div>
           </motion.section>
        )}
      </AnimatePresence>

    </main>
  );
}

export default function PromoteHub() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
      </div>
    }>
      <PromoteHubContent />
    </Suspense>
  );
}
