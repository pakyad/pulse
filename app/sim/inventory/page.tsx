'use client'
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Package, ShieldCheck, Zap, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventorySimulation() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [itemId, setItemId] = useState<string>('sim-hoodie-' + Date.now());

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // 1. Create the item
  const startSimulation = async () => {
    setLoading(true);
    addLog("Initializing Institutional Registry...");
    try {
      await setDoc(doc(db, 'items', itemId), {
        title: "Limited Pulse 'Drake' Hoodie",
        price: 189,
        stock_count: 2,
        seller_name: "Pulse Official",
        image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
        status: "active",
        category: "APPAREL",
        created_at: serverTimestamp()
      });
      addLog("ASSET CREATED: 2 Units in Stock.");
      setStep(1);
    } catch (e) {
      addLog("ERROR: Registry rejection.");
    }
    setLoading(false);
  };

  // 2. Buy one
  const simulatePurchase = async (purchaser: string) => {
    setLoading(true);
    addLog(`Simulating purchase by ${purchaser}...`);
    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'items', itemId);
        const itemSnap = await transaction.get(itemRef);
        const stock = itemSnap.data()?.stock_count || 0;

        if (stock <= 0) throw new Error("SOLD_OUT");

        transaction.update(itemRef, { stock_count: stock - 1 });
        addLog(`TRANSACTION SUCCESS: Stock decremented to ${stock - 1}`);
      });
      if (step === 1) setStep(2);
      if (step === 2) setStep(3);
    } catch (e: any) {
      addLog(`GUARD TRIGGERED: ${e.message === 'SOLD_OUT' ? 'Institutional block! Item is empty.' : 'Error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 bg-blue-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Zap size={20} className="text-amber-400" />
            </div>
            <h1 className="text-[18px] font-black uppercase tracking-widest">Inventory Sim</h1>
          </div>
          <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
            Testing Institutional Guard & Atomic Stock decrement logic for Pulse Marketplace.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Steps Visualizer */}
          <div className="flex justify-between items-center px-2">
             {[1,2,3].map((s) => (
               <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-emerald-500' : 'w-6 bg-slate-100'}`} />
             ))}
          </div>

          <div className="space-y-6">
            {step === 0 && (
              <button 
                onClick={startSimulation}
                disabled={loading}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md shadow-slate-900/10"
              >
                Launch Hoodie Drop <ArrowRight size={18} />
              </button>
            )}

            {step === 1 && (
              <div className="space-y-4">
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <p className="text-[13px] font-bold text-emerald-800">Hoodie is LIVE with 2 stock.</p>
                 </div>
                 <button 
                  onClick={() => simulatePurchase("Student A")}
                  disabled={loading}
                  className="w-full h-14 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  Student A: Buy 1 <Package size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                 <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                    <Zap className="text-amber-500" size={20} />
                    <p className="text-[13px] font-bold text-amber-800">Low Stock Alert: 1 unit remaining.</p>
                 </div>
                 <button 
                  onClick={() => simulatePurchase("Student B")}
                  disabled={loading}
                  className="w-full h-14 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  Student B: Buy Last Unit <Lock size={18} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100 mb-2">
                    <ShieldCheck size={32} />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-[18px] font-bold text-slate-900">Simulation Complete</h2>
                    <p className="text-[12px] font-medium text-slate-400">The Atomic Shield has successfully locked the item.</p>
                 </div>
                 <div className="flex flex-col gap-2">
                    <a 
                      href="/marketplace" 
                      className="h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[12px] font-bold text-slate-600 hover:bg-white transition-all"
                    >
                      Verify Marketplace Blur
                    </a>
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-all pt-2"
                    >
                      Reset Sim
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* Log Window */}
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">System Terminal</p>
             <div className="h-40 bg-slate-50 rounded-2xl p-4 overflow-y-auto border border-slate-100 font-mono text-[10px] space-y-2 text-slate-400">
                {log.length === 0 && <p className="opacity-40 italic">Waiting for simulation trigger...</p>}
                {log.map((l, i) => (
                  <p key={i} className={l.includes('ERROR') || l.includes('GUARD') ? 'text-red-400 font-bold' : l.includes('SUCCESS') ? 'text-emerald-500 font-bold' : ''}>
                    {l}
                  </p>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
