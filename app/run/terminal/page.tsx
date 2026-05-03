'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Package, 
  TrendingUp, 
  Zap, 
  Navigation,
  MapPin,
  Clock,
  Activity,
  Camera
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, serverTimestamp, runTransaction, addDoc } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CampusVitals from '@/components/shared/CampusVitals';
import { seedKelabBolaItems } from '@/lib/utils/seed-kelab-bola';

const CAMPUS_ZONES = ['ALL ZONES', 'MIIT', 'CAFETERIA', 'V1 HOSTEL', 'LIBRARY', 'ADMIN'];

export default function CarrierTerminal() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [activeZone, setActiveZone] = useState('ALL ZONES');
    const [jobs, setJobs] = useState<any[]>([]);
    const [activeMission, setActiveMission] = useState<any>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(user => {
            if (user) {
                onSnapshot(doc(db, "users", user.uid), (snap) => {
                    const data = snap.data();
                    if (!data?.is_verified_runner) router.push('/run');
                    setProfile(data);
                    setLoading(false);
                }, (err) => { console.error(err); setLoading(false); });

                const qActive = query(
                    collection(db, "orders"), 
                    where("runner_id", "==", user.uid), 
                    where("status", "in", ["RUNNER_EN_ROUTE_TO_VENDOR", "IN_TRANSIT"])
                );
                onSnapshot(qActive, (snap) => {
                    if (!snap.empty) {
                        setActiveMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
                    } else {
                        setActiveMission(null);
                    }
                });
            } else {
                router.push('/auth');
            }
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (!isOnline) {
            setJobs([]);
            return;
        }
        const q = query(collection(db, "orders"), where("status", "==", "WAITING_FOR_RUNNER"));
        const unsubJobs = onSnapshot(q, (snap) => {
            const fetchedJobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setJobs(fetchedJobs);
        }, (err) => console.error("DEBUG [Registry Sync]:", err));
        return () => unsubJobs();
    }, [isOnline]);

    const seedMissions = async () => {
        // Seed Kelab Bola Items first for the marketplace
        await seedKelabBolaItems('kelab-bola-uid'); // We will use a consistent ID for testing

        const JOBS = [
            { source: "Kelab Bola (Admin)", dest: "MIIT Lvl 4", fee: 4.50, type: "SPORTS", zone: "MIIT", status: "WAITING_FOR_RUNNER", instructions: "Leave at MIIT Security Guard", created_at: serverTimestamp() },
            { source: "Mail Hub", dest: "V1 Block B", fee: 5.00, type: "PARCEL", zone: "V1 HOSTEL", status: "WAITING_FOR_RUNNER", instructions: "Hang on door handle", created_at: serverTimestamp() },
            { source: "Library Kiosk", dest: "Admin Office", fee: 3.50, type: "PRINT", zone: "LIBRARY", status: "WAITING_FOR_RUNNER", created_at: serverTimestamp() }
        ];
        for (const job of JOBS) { await addDoc(collection(db, "orders"), job); }
        alert("✨ Registry Hydrated (Kelab Bola + Missions).");
    };

    const handleAcceptJob = async (jobId: string) => {
       const uid = profile?.uid || auth.currentUser?.uid;
       if (!uid) {
           alert("Identity not found. Please refresh.");
           return;
       }
       
       try {
           await runTransaction(db, async (transaction) => {
               const jobRef = doc(db, "orders", jobId);
               const jobSnap = await transaction.get(jobRef);
               
               if (!jobSnap.exists()) throw "Directive vanished from registry.";
               if (jobSnap.data().runner_id) throw "Directive already claimed by another carrier.";
               
               transaction.update(jobRef, { 
                   runner_id: uid, 
                   status: 'RUNNER_EN_ROUTE_TO_VENDOR', 
                   accepted_at: serverTimestamp() 
               });
           });
       } catch (e: any) { 
           alert(`System Error: ${e}`); 
       }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F2F2F7] border-t-[#00C4B4] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white font-sans antialiased text-[#222222] pb-48">
            
            <nav className="fixed top-0 left-0 right-0 z-[100] h-20 bg-white border-b border-[#F2F2F7] flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/run')} className="text-[#1C1C1E]">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-[18px] font-bold text-[#1C1C1E]">Terminal</h1>
                        <button 
                            onClick={() => setIsOnline(!isOnline)}
                            className={`w-10 h-5 rounded-full border border-[#F2F2F7] ${isOnline ? 'bg-[#00C4B4]' : 'bg-[#E5E5EA]'} transition-colors relative`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isOnline ? 'left-5' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={seedMissions}
                        className="bg-[#00C4B4] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full"
                    >
                        HYDRATE REGISTRY
                    </button>
                    <div className="text-[#1C1C1E]"><Bell size={20} /></div>
                    <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
                </div>
            </nav>

            <div className="pt-28 px-6 space-y-10">
                <AnimatePresence mode="wait">
                    {activeMission ? (
                        <motion.div 
                            key="mission"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-10"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">Active Delivery</h3>
                                <div className="px-3 py-1 bg-[#00C4B4]/10 rounded-full flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C4B4] animate-pulse" />
                                    <span className="text-[9px] font-bold text-[#00C4B4] uppercase tracking-wider">
                                        {activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'To Vendor' : 
                                         activeMission.status === 'IN_TRANSIT' ? 'On the Way' : activeMission.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-[#F2F2F7] rounded-[24px] p-8 space-y-8">
                                <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-[#1C1C1E] bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E]" /></div>
                                        <div className="w-0.5 h-12 bg-[#F2F2F7]" />
                                        <MapPin size={18} className="text-[#00C4B4]" />
                                    </div>
                                    <div className="space-y-8 flex-1">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Pickup From</p>
                                            <h4 className="text-[17px] font-bold text-[#1C1C1E]">{activeMission.source}</h4>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Deliver To</p>
                                            <h4 className="text-[17px] font-bold text-[#1C1C1E]">{activeMission.dest}</h4>
                                            {activeMission.instructions && (
                                                <p className="text-[11px] font-medium text-[#00C4B4] mt-1 italic">"{activeMission.instructions}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-[#F2F2F7] flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest text-left">Fee</p>
                                        <p className="text-[24px] font-bold text-[#1C1C1E]">RM {activeMission.fee?.toFixed(2) || '5.00'}</p>
                                    </div>
                                    <button 
                                      className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#1C1C1E]"
                                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${activeMission.dest}`, '_blank')}
                                    >
                                        <Navigation size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {capturedImage && (
                                    <div className="flex justify-center">
                                        <div className="w-20 h-20 rounded-xl border border-[#F2F2F7] overflow-hidden bg-slate-50 relative group">
                                            <img src={capturedImage} alt="Captured proof" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setCapturedImage(null)}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="text-white text-[10px] font-bold">RETAKE</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? (
                                    !capturedImage ? (
                                        <button 
                                            onClick={() => setCapturedImage('https://images.unsplash.com/photo-1580087443545-73f55694276f?q=80&w=200')}
                                            className="w-full h-16 bg-[#1C1C1E] text-white rounded-[22px] font-bold text-[14px] flex items-center justify-center gap-3"
                                        >
                                            <Camera size={20} />
                                            Take Photo of Item
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={async () => {
                                                setIsUploading(true);
                                                await updateDoc(doc(db, "orders", activeMission.id), { 
                                                    status: 'IN_TRANSIT',
                                                    pickup_photo_url: capturedImage 
                                                });
                                                setCapturedImage(null);
                                                setIsUploading(false);
                                            }}
                                            disabled={isUploading}
                                            className="w-full h-16 bg-[#00C4B4] text-white rounded-[22px] font-bold text-[14px]"
                                        >
                                            {isUploading ? 'Processing...' : 'Confirm Pickup'}
                                        </button>
                                    )
                                ) : (
                                    !capturedImage ? (
                                        <button 
                                            onClick={() => setCapturedImage('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=200')}
                                            className="w-full h-16 bg-[#1C1C1E] text-white rounded-[22px] font-bold text-[14px] flex items-center justify-center gap-3"
                                        >
                                            <Camera size={20} />
                                            Take Photo of Drop-off
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={async () => {
                                                setIsUploading(true);
                                                await updateDoc(doc(db, "orders", activeMission.id), { 
                                                    status: 'DELIVERED', 
                                                    completed_at: serverTimestamp(),
                                                    dropoff_photo_url: capturedImage
                                                });
                                                setCapturedImage(null);
                                                setIsUploading(false);
                                            }}
                                            disabled={isUploading}
                                            className="w-full h-16 bg-[#00C4B4] text-white rounded-[22px] font-bold text-[14px]"
                                        >
                                            {isUploading ? 'Processing...' : 'Delivery Done'}
                                        </button>
                                    )
                                )}
                                
                                <button 
                                    onClick={() => updateDoc(doc(db, "orders", activeMission.id), { runner_id: null, status: 'AVAILABLE' })}
                                    className="w-full text-center text-[11px] font-bold text-red-400 uppercase tracking-widest pt-2"
                                >
                                    Debug: Force Clear Mission
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="registry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            
                            {/* --- ANALYTICS MATRIX --- */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">Performance Index</h3>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00C4B4]" />
                                        <span className="text-[9px] font-bold text-[#00C4B4] uppercase tracking-wider">Top 5%</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-[#F2F2F7] rounded-[22px] p-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-[#8E8E93]" />
                                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8E8E93]">Earnings</p>
                                        </div>
                                        <p className="text-[24px] font-bold text-[#1C1C1E] tracking-tighter">RM {(profile?.balance || 45.00).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white border border-[#F2F2F7] rounded-[22px] p-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Activity size={14} className="text-[#8E8E93]" />
                                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8E8E93]">Hustle Rate</p>
                                        </div>
                                        <p className="text-[24px] font-bold text-[#1C1C1E] tracking-tighter">98%</p>
                                    </div>
                                </div>
                            </div>

                            {/* --- DISPATCH ZONES --- */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">Operational Dispatch</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CAMPUS_ZONES.map(zone => (
                                        <button 
                                            key={zone}
                                            onClick={() => setActiveZone(zone)}
                                            className={`h-8 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                                                activeZone === zone 
                                                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]' 
                                                : 'bg-white text-[#8E8E93] border-[#F2F2F7]'
                                            }`}
                                        >
                                            {zone}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* --- READINESS CHECKLIST --- */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">Terminal Readiness</h3>
                                <div className="border border-[#F2F2F7] rounded-[22px] divide-y divide-[#F2F2F7] overflow-hidden">
                                    <div className="h-14 px-5 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-3">
                                            <Package size={16} className="text-[#1C1C1E]" />
                                            <span className="text-[13px] font-medium text-[#1C1C1E]">Verified Transit Method</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#00C4B4] uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="h-14 px-5 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-3">
                                            <Zap size={16} className="text-[#1C1C1E]" />
                                            <span className="text-[13px] font-medium text-[#1C1C1E]">High-Velocity Eligibility</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#00C4B4] uppercase tracking-widest">Tier 1</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isOnline && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.2em]">Live Directives</h3>
                                        </div>
                                        <div className="border border-[#F2F2F7] rounded-[22px] overflow-hidden">
                                            {(() => {
                                                const filtered = activeZone === 'ALL ZONES' ? jobs : jobs.filter(j => j.zone === activeZone);
                                                return filtered.length === 0 ? (
                                                    <div className="h-40 flex flex-col items-center justify-center bg-white">
                                                        <p className="text-[10px] font-bold text-[#D1D1D6] uppercase tracking-[0.2em]">No Directives in {activeZone}</p>
                                                    </div>
                                                ) : (
                                                    filtered.map((job, idx) => (
                                                        <div 
                                                            key={job.id} 
                                                            className={`flex items-center justify-between h-16 px-5 bg-white ${idx !== filtered.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}
                                                        >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00C4B4]" />
                                                            <div>
                                                                <h4 className="text-[14px] font-bold text-[#1C1C1E] tracking-tight">{job.source} → {job.dest}</h4>
                                                                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest mt-0.5">{job.type} • PRIORITY</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <p className="text-[15px] font-bold text-[#1C1C1E]">RM {job.fee?.toFixed(2)}</p>
                                                            <button 
                                                                onClick={() => handleAcceptJob(job.id)} 
                                                                className="h-8 px-4 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                        </div>
                                                    </div>
                                                    )))
                                                })()}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <CampusVitals />
        </main>
    );
}
