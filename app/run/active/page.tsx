'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Map, Navigation, Phone, MessageSquare, CheckCircle2, AlertTriangle, ShieldAlert, Package, Navigation2 } from 'lucide-react';

export default function ActiveRunPage() {
   const router = useRouter();
   const [step, setStep] = useState(1); // 1: Heading to pickup, 2: At Pickup, 3: Heading to Dropoff, 4: Delivered

   return (
      <main className="min-h-screen bg-[#FDFDFD] font-sans text-navy pb-32">
         {/* Top Bar */}
         <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-8 pb-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-50">
            <button onClick={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full active:scale-90 transition-transform">
               <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order #PL-992A</p>
               <h1 className="text-[16px] font-bold text-navy">Live Delivery</h1>
            </div>
            <button className="p-2 bg-red-50 text-red-500 rounded-full active:scale-90 transition-transform">
               <ShieldAlert size={20} />
            </button>
         </nav>

         <div className="pt-24 space-y-2">
            
            {/* The Map Visual */}
            <div className="h-[280px] bg-slate-100 relative overflow-hidden mx-5 rounded-[2rem] border border-slate-200">
               {/* Abstract map pattern */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
               
               {/* Route Line */}
               <div className="absolute top-1/2 left-1/4 right-1/4 h-1.5 bg-blue-200 rounded-full -translate-y-1/2" />
               <div className="absolute top-1/2 left-1/4 w-1/2 h-1.5 bg-blue-500 rounded-full -translate-y-1/2 origin-left transition-all duration-1000" style={{ scaleX: step >= 3 ? 1 : 0.2 }} />
               
               {/* Waypoints */}
               <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-colors duration-500 ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                     {step >= 2 ? <CheckCircle2 size={16} /> : <Package size={16} />}
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm mt-3 border border-slate-100">
                     <p className="text-[11px] font-bold text-navy whitespace-nowrap">Cafe Block A</p>
                  </div>
               </div>

               <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-colors duration-500 ${step >= 4 ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                     {step >= 4 ? <CheckCircle2 size={16} /> : <Navigation2 size={16} className="-ml-0.5 mt-0.5" />}
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm mt-3 border border-slate-100">
                     <p className="text-[11px] font-bold text-navy whitespace-nowrap">Library East</p>
                  </div>
               </div>
            </div>

            {/* Content Container */}
            <div className="px-5 pt-6 space-y-6">
               
               {/* Customer & Order Box */}
               <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-5">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <h3 className="text-[16px] font-bold text-navy">Amirul H.</h3>
                           <p className="text-[12px] font-medium text-slate-400">Customer</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center active:scale-90 transition-transform">
                           <MessageSquare size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center active:scale-90 transition-transform">
                           <Phone size={18} />
                        </button>
                     </div>
                  </div>

                  <div>
                     <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-3">Order Details</p>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-[14px]">
                           <span className="font-bold text-navy">1x Nasi Lemak Ayam</span>
                           <span className="font-bold text-navy">RM 8.50</span>
                        </div>
                        <div className="flex justify-between items-center text-[14px]">
                           <span className="font-bold text-slate-400">1x Iced Milo</span>
                           <span className="font-bold text-slate-400">RM 3.00</span>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Progress Status Text */}
               <div className="text-center px-4">
                  <h2 className="text-[22px] font-bold text-navy tracking-tight mb-2">
                     {step === 1 && "Head to Pickup Location"}
                     {step === 2 && "Pick Up the Order"}
                     {step === 3 && "Deliver to Customer"}
                     {step === 4 && "Delivery Complete!"}
                  </h2>
                  <p className="text-[14px] text-slate-500 font-medium">
                     {step === 1 && "Cafe Block A is expecting you."}
                     {step === 2 && "Show your Runner ID to the cashier."}
                     {step === 3 && "Customer is waiting at Library East."}
                     {step === 4 && "Great job! Earnings have been added to your ledger."}
                  </p>
               </div>
            </div>
         </div>

         {/* Fixed Action Button */}
         <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD] to-transparent pt-10">
            {step < 4 ? (
               <button 
                  onClick={() => setStep(step + 1)}
                  className="w-full h-16 bg-navy text-white rounded-[1.5rem] font-bold text-[16px] shadow-lg shadow-navy/20 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  {step === 1 && "I've Arrived at Pickup"}
                  {step === 2 && "Confirm Pick Up"}
                  {step === 3 && "Swipe to Complete Delivery"}
               </button>
            ) : (
               <button 
                  onClick={() => router.push('/run')}
                  className="w-full h-16 bg-emerald-500 text-white rounded-[1.5rem] font-bold text-[16px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                  <CheckCircle2 size={20} /> Finish & Return to Hub
               </button>
            )}
         </div>
      </main>
   )
}
