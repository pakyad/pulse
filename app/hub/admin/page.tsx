'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronLeft, 
  Clock, 
  FileText, 
  AlertCircle, 
  CreditCard, 
  Stethoscope, 
  ArrowRight,
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useRouter } from 'next/navigation';

const CHANNELS = [
  { 
    id: 'mc', 
    title: 'Medical (MC)', 
    sub: 'Submit sick leave for classes', 
    icon: Stethoscope, 
    color: 'bg-emerald-50 text-emerald-600',
    fields: ['Date Range', 'Clinic Name', 'MC Document']
  },
  { 
    id: 'appeal', 
    title: 'Exam Appeal', 
    sub: 'Remarking & eligibility requests', 
    icon: AlertCircle, 
    color: 'bg-amber-50 text-amber-600',
    fields: ['Course Code', 'Appeal Type', 'Justification']
  },
  { 
    id: 'request', 
    title: 'Official Request', 
    sub: 'Leave of absence & letters', 
    icon: FileText, 
    color: 'bg-violet-50 text-violet-600',
    fields: ['Subject', 'Purpose', 'Supporting Document']
  }
];

const ACTIVE_SUBMISSIONS = [
  { id: 'SUB-9921', title: 'Exam Appeal (SE102)', status: 'UNDER REVIEW', date: '2h ago', color: 'text-amber-500' },
  { id: 'SUB-9918', title: 'Medical Certificate', status: 'APPROVED', date: 'Yesterday', color: 'text-emerald-500' },
];

export default function AdminHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      {/* 1. REGISTRY HEADER */}
      <section className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <BackButton />
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400  mb-1">MIIT Registry</p>
          <h1 className="text-[18px] font-bold tracking-widest text-navy">Administrative Desk</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white">
           <ShieldCheck size={18} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 mt-10 space-y-12">
        
        {/* 2. SUBMISSION STATUS LEDGER */}
        <section className="space-y-4">
           <div className="flex justify-between items-end">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">Active Submissions</h3>
              <span className="text-[10px] font-bold text-slate-300 ">Total: {ACTIVE_SUBMISSIONS.length}</span>
           </div>
           
           <div className="space-y-3">
              {ACTIVE_SUBMISSIONS.map((sub) => (
                <div key={sub.id} className="p-5 bg-white border border-slate-100 rounded-4xl flex items-center justify-between group cursor-pointer hover:shadow-md hover:shadow-navy/5 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                         <Clock size={18} />
                      </div>
                      <div>
                         <h4 className="text-[14px] font-bold text-navy">{sub.title}</h4>
                         <p className="text-[10px] font-bold text-slate-300 ">{sub.id} • {sub.date}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold  ${sub.color}`}>{sub.status}</span>
                      <ArrowRight size={14} className="text-slate-200 group-hover:text-navy group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* 3. CHANNEL SELECTION */}
        <section className="space-y-6">
           <div className="flex flex-col gap-1">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">New Submission</h3>
              <p className="text-[13px] text-slate-400 font-medium">Select a channel to narrow down your request.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHANNELS.map((channel) => (
                <motion.button
                  key={channel.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChannel(channel.id)}
                  className="p-8 bg-white border border-slate-100 rounded-[3rem] text-left space-y-6 group hover:border-navy transition-all hover:shadow-md hover:shadow-navy/5"
                >
                   <div className={`w-14 h-14 rounded-2xl ${channel.color} flex items-center justify-center shadow-sm`}>
                      <channel.icon size={28} strokeWidth={1.5} />
                   </div>
                   <div>
                      <h4 className="text-[18px] font-bold text-navy tracking-widest mb-1">{channel.title}</h4>
                      <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{channel.sub}</p>
                   </div>
                   <div className="flex flex-wrap gap-2 pt-2">
                      {channel.fields.map((f, i) => (
                        <span key={i} className="text-[8px] font-bold text-slate-300 border border-slate-100 px-2 py-0.5 rounded-md ">{f}</span>
                      ))}
                   </div>
                </motion.button>
              ))}
           </div>
        </section>

        {/* 4. HELP FOOTER */}
        <section className="bg-slate-50 border border-slate-100 rounded-[3rem] p-8 text-center space-y-4">
           <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-navy shadow-sm">
              <FileText size={20} />
           </div>
           <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-navy">Admin Policy</h3>
              <p className="text-[12px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                 Submissions are processed within 3 working days. Ensure all attached documents are original copies.
              </p>
           </div>
           <button className="text-[11px] font-bold text-navy  underline underline-offset-8 decoration-slate-200">
              View Submission Guidelines
           </button>
        </section>

      </div>

      {/* 5. FORM MODAL OVERLAY (SIMULATED) */}
      <AnimatePresence>
        {selectedChannel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-navy/80 backdrop-blur-md flex items-end md:items-center justify-center"
          >
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="w-full max-w-lg bg-white rounded-t-[3rem] md:rounded-[3rem] p-10 relative shadow-md"
             >
                <button 
                  onClick={() => setSelectedChannel(null)}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-navy"
                >
                   <X size={20} />
                </button>

                <div className="space-y-8">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CHANNELS.find(c => c.id === selectedChannel)?.color}`}>
                            {(() => {
                              const Icon = CHANNELS.find(c => c.id === selectedChannel)?.icon;
                              return Icon ? <Icon size={20} /> : null;
                            })()}
                         </div>
                         <h2 className="text-[24px] font-bold text-navy tracking-tight">
                            {CHANNELS.find(c => c.id === selectedChannel)?.title} Submission
                         </h2>
                      </div>
                      <p className="text-[14px] text-slate-400 font-medium">Please fill in the details below to narrow down your request.</p>
                   </div>

                   <form className="space-y-6">
                      {selectedChannel === 'mc' ? (
                        /* ... (existing MC flow) ... */
                        <div className="space-y-6">
                           {/* VERIFIED IDENTITY HEADER */}
                           <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-navy shadow-sm overflow-hidden">
                                 <img 
                                   src="https://api.dicebear.com/7.x/initials/svg?seed=IyadMohmad" 
                                   alt="User" 
                                   className="w-full h-full object-cover"
                                 />
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-[14px] font-bold text-navy">Iyad Mohmad</h4>
                                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md  border border-emerald-100">Verified ID</span>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 ">Matric: 52216121092 • Bachelor (SE)</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 ">Select Subject</label>
                                 <select className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium outline-none focus:border-navy transition-all">
                                    <option value="">Choose your subject...</option>
                                    <option>SE102 - Mobile App Dev (Dr. Felix)</option>
                                    <option>SE103 - Cloud Architecture (Prof. Marcus)</option>
                                    <option>DS201 - Data Visualization (Dr. Elena)</option>
                                    <option>IT101 - Intro to Programming (Sir Ahmad)</option>
                                 </select>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 ">Date of Absence</label>
                                    <input 
                                       type="date" 
                                       className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium outline-none focus:border-navy transition-all"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 ">Class Time</label>
                                    <input 
                                       type="time" 
                                       className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium outline-none focus:border-navy transition-all"
                                    />
                                 </div>
                              </div>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 ">Upload MC Document</label>
                              <div className="w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 hover:border-navy transition-all cursor-pointer">
                                 <Plus size={24} />
                                 <p className="text-[11px] font-bold  mt-2">Select Image/PDF</p>
                              </div>
                           </div>
                        </div>
                      ) : selectedChannel === 'appeal' ? (
                        /* DETAILED EXAM APPEAL FLOW */
                        <div className="space-y-6">
                           <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-navy shadow-sm overflow-hidden">
                                 <img src="https://api.dicebear.com/7.x/initials/svg?seed=IyadMohmad" alt="User" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                 <h4 className="text-[14px] font-bold text-navy">Iyad Mohmad</h4>
                                 <p className="text-[10px] font-bold text-slate-400 ">Exam Appeal Desk</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 ">Course to Appeal</label>
                                 <select className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium outline-none focus:border-navy transition-all">
                                    <option value="">Select your course...</option>
                                    <option>SE102 - Mobile Application Development</option>
                                    <option>SE103 - Cloud Computing Architecture</option>
                                    <option>DS201 - Data Visualization</option>
                                 </select>
                              </div>

                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 ">Appeal Type</label>
                                 <select className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium outline-none focus:border-navy transition-all">
                                    <option value="">Select type...</option>
                                    <option>Remarking (Re-check grade)</option>
                                    <option>Attendance Bar (Eligibility)</option>
                                    <option>Late Exam Entry (Resit)</option>
                                    <option>Special Consideration</option>
                                 </select>
                              </div>

                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 ">Justification</label>
                                 <textarea 
                                    placeholder="Explain your reason for this appeal..."
                                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-[14px] font-medium outline-none focus:border-navy transition-all resize-none"
                                 />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[11px] font-bold text-slate-400 ">Supporting Evidence</label>
                              <div className="w-full h-24 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 hover:border-navy transition-all cursor-pointer">
                                 <Plus size={20} />
                                 <p className="text-[10px] font-bold  mt-1">Upload Support Letter</p>
                              </div>
                           </div>
                        </div>
                      ) : (
                        /* GENERAL FLOW FOR OTHER CHANNELS */
                        CHANNELS.find(c => c.id === selectedChannel)?.fields.map((field, i) => (
                          <div key={i} className="space-y-2">
                             <label className="text-[11px] font-bold text-slate-400 ">{field}</label>
                             <input 
                                type="text" 
                                placeholder={`Enter ${field.toLowerCase()}...`}
                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-medium focus:bg-white focus:border-navy transition-all"
                             />
                          </div>
                        ))
                      )}
                      
                      <div className="pt-4">
                         <button 
                           type="button"
                           onClick={() => setSelectedChannel(null)}
                           className="w-full h-16 bg-navy text-white rounded-4xl font-bold tracking-widest hover:bg-navy/90 active:scale-95 transition-all shadow-md shadow-navy/20 flex items-center justify-center gap-3"
                         >
                            <Plus size={20} />
                            Submit to Registry
                         </button>
                      </div>
                   </form>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
