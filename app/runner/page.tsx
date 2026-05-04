"use client";
import React, { useState } from 'react';

export default function MobileRunnerDashboard() {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Mock data for the layout
  const activeJob = {
    pickup: "Block C Cafe",
    delivery: "Bus Stop A",
    status: "ACCEPTED",
    id: "9MXK2P"
  };

  const nearbyDeliveries = [
    { id: "3A89JL", earnings: 3.00, distance: "200m away" },
    { id: "4B12MN", earnings: 4.50, distance: "450m away" }
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#F2F2F7] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans selection:bg-[#F2F2F7]">
      
      {/* 1. Top App Bar & Status (Sticky) */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pulse Runner</h1>
        <div className="flex items-center gap-3">
           <span className={`text-[13px] font-bold tracking-tight transition-colors ${isOnline ? 'text-[#34C759]' : 'text-[#8E8E93]'}`}>
              {isOnline ? 'Online' : 'Offline'}
           </span>
           {/* Standard iOS-style toggle switch */}
           <button 
             onClick={() => setIsOnline(!isOnline)}
             className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 ease-in-out shrink-0 ${isOnline ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}
           >
             <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-in-out ${isOnline ? 'translate-x-[20px]' : 'translate-x-0'}`} />
           </button>
        </div>
      </div>

      <div className="flex-1 pb-24">
         {/* 2. Section 1: Active Job (The Map & Action Card) */}
         <div className="border-b-[0.5px] border-[#E5E5EA] pb-6">
            {/* Map Placeholder */}
            <div className="w-full h-48 bg-[#F2F2F7] relative overflow-hidden border-b-[0.5px] border-[#E5E5EA]">
               {/* Subtle CSS Grid for map texture */}
               <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#E5E5EA 1px, transparent 1px), linear-gradient(90deg, #E5E5EA 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
               
               {/* Map Nodes */}
               <div className="absolute top-[40%] left-[30%]">
                  <div className="w-4 h-4 bg-[#007AFF] rounded-full border-2 border-white shadow-sm relative z-10"></div>
                  <div className="w-4 h-4 bg-[#007AFF] rounded-full absolute inset-0 animate-ping opacity-75"></div>
               </div>
               
               {/* Dashed line connecting nodes (approximate visual) */}
               <svg className="absolute top-[25%] left-[32%] w-[40%] h-[20%] text-[#1C1C1E] opacity-20" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" d="M 0 100 Q 50 0 100 0" />
               </svg>

               <div className="absolute top-[20%] right-[30%] flex flex-col items-center">
                  <div className="w-6 h-6 bg-[#34C759] rounded-full border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                     <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* Job Details */}
            <div className="px-5 pt-6">
               <h2 className="text-[13px] font-bold text-[#8E8E93] tracking-widest uppercase mb-2">Current Task</h2>
               <div className="flex flex-col gap-1">
                  <p className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pickup at {activeJob.pickup}</p>
                  <p className="text-[15px] font-medium text-[#8E8E93]">Deliver to {activeJob.delivery}</p>
               </div>
            </div>

            {/* Action Button */}
            <div className="px-4 mt-6">
               <button className="w-full bg-[#1C1C1E] text-white text-[17px] font-bold py-4 rounded-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                  Slide to Confirm Pickup
               </button>
            </div>
         </div>

         {/* 3. Section 2: Available Jobs Radar */}
         <div className="px-5 py-8">
            <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-5">Nearby Deliveries</h2>
            
            <div className="flex flex-col space-y-4">
               {nearbyDeliveries.map((job, idx) => (
                 <div key={job.id} className={`flex items-center justify-between pb-4 ${idx !== nearbyDeliveries.length - 1 ? 'border-b-[0.5px] border-[#E5E5EA]' : ''}`}>
                    <div>
                       <p className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">RM {job.earnings.toFixed(2)}</p>
                       <p className="text-[13px] font-medium text-[#8E8E93] mt-0.5">{job.distance}</p>
                    </div>
                    <button className="text-[14px] font-bold text-[#34C759] bg-[#E8F8EE] px-5 py-2.5 rounded-[10px] active:opacity-70 transition-opacity tracking-tight">
                       Accept Job
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* 4. Bottom Navigation Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t-[0.5px] border-[#E5E5EA] pb-8 pt-3 px-6 z-30">
         <div className="flex items-center justify-between max-w-sm mx-auto">
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
               <span className="text-[10px] font-bold text-[#1C1C1E]">Radar</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Tasks</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Earnings</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Profile</span>
            </button>
         </div>
      </div>

    </div>
  );
}
