'use client'
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Bell, 
  Package, 
  TrendingUp, 
  Zap, 
  Power, 
  Navigation 
} from 'lucide-react';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

export default function RunnerDashboard({ profile, onBack }: { profile: any, onBack: () => void }) {
    const activeMissions = profile?.current_missions || [];
    const hasActive = activeMissions.length > 0;

    return (
       <div className="min-h-screen bg-white pb-32">
          {/* ── CARRIER HEADER ── */}
          <nav className="fixed top-0 left-0 right-0 z-50 px-8 pt-12 pb-6 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-slate-50">
             <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-300 active:scale-90 transition-all">
                   <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold tracking-tight text-[#222222]">Runner Hub</h1>
             </div>
             <div className="flex items-center gap-4">
                <button className="text-slate-300 active:scale-90 transition-all"><LayoutGrid size={20} /></button>
                <button className="text-slate-300 active:scale-90 transition-all"><Bell size={20} /></button>
                <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
             </div>
          </nav>

          <div className="pt-32 px-8 space-y-12">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0F1E] rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-navy/10 min-h-[160px]">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total Balance</p>
                   <div>
                      <p className="text-[24px] font-bold text-white tracking-tight">RM {(profile?.balance || 45.00).toFixed(2)}</p>
                      <button className="text-[11px] font-bold text-white/50 mt-2 flex items-center gap-1">Manage Wallet <ChevronRight size={12}/></button>
                   </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[160px]">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Rating</p>
                   </div>
                   <div>
                      <p className="text-[24px] font-bold text-[#222222] tracking-tight">4.98%</p>
                      <p className="text-[11px] font-bold text-[#00927C] mt-2 flex items-center gap-1">Elite Status <TrendingUp size={12}/></p>
                   </div>
                </div>
             </div>

             <div className="pb-20 text-center space-y-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Power size={24} className="text-slate-200" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-[20px] font-bold text-[#222222]">Runner Offline</h3>
                    <p className="text-[14px] text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                        Activate your working status to receive delivery requests.
                    </p>
                </div>
             </div>
          </div>
       </div>
    );
}
