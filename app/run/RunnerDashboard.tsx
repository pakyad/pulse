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
import { useRouter } from 'next/navigation';

export default function RunnerDashboard({ profile, onBack }: { profile: any, onBack: () => void }) {
    const router = useRouter();
    const activeMissions = profile?.current_missions || [];
    const hasActive = activeMissions.length > 0;

    return (
       <div className="min-h-screen bg-[#F9F9FB] pb-32 font-sans antialiased">
          {/*  CARRIER HEADER  */}
          <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
             <div className="flex items-center gap-3">
                <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all">
                   <ChevronLeft size={20} />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Runner Hub</h1>
             </div>
             <div className="flex items-center gap-4">
                <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
             </div>
          </nav>

          <div className="pt-28 px-6 space-y-8">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-2xl p-6 flex flex-col justify-between shadow-md min-h-[140px]">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</p>
                   <div>
                      <p className="text-2xl font-bold text-white tracking-tight">RM {(profile?.balance || 0).toFixed(2)}</p>
                      <button 
                         onClick={() => router.push('/run/wallet')}
                         className="text-[11px] font-bold text-gray-400 mt-2 flex items-center gap-1 active:scale-95 transition-all uppercase"
                      >
                         Manage <ChevronRight size={12}/>
                      </button>
                   </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm min-h-[140px]">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
                   </div>
                   <div>
                      <p className="text-2xl font-bold text-gray-900 tracking-tight">{(profile?.trust_rating || 5.0).toFixed(1)}</p>
                      <p className="text-[11px] font-bold text-[#1D9E75] mt-2 flex items-center gap-1 uppercase">Elite Status <TrendingUp size={12}/></p>
                   </div>
                </div>
             </div>

             <div className="pb-20 text-center space-y-6 pt-10">
                <div className="w-16 h-16 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
                    <Power size={24} className="text-gray-300" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Runner Offline</h3>
                    <p className="text-sm text-gray-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                        Activate your working status to receive delivery requests.
                    </p>
                </div>
             </div>
          </div>
       </div>
    );
}
