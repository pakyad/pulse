"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ChevronDown, CheckCircle2, 
  XCircle, Truck, Store, Info, Scale, AlertTriangle
} from 'lucide-react';
import { useState } from 'react';

export default function AdminDisputeGuide() {
  const [openSection, setOpenSection] = useState<string | null>('logic');

  const DrakeAccordion = ({ id, title, icon: Icon, children }: any) => (
    <div className="border border-slate-100 rounded-2xl overflow-hidden mb-3 bg-white">
      <button 
        onClick={() => setOpenSection(openSection === id ? null : id)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#1e293b]">
            <Icon size={16} />
          </div>
          <span className="text-[13px] font-bold text-[#1e293b]">{title}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-300 transition-transform ${openSection === id ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {openSection === id && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5 pt-2 border-t border-slate-50 text-[12px] text-[#94a3b8] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-1 rounded-full bg-red-500" />
        <h3 className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Admin Decision Kit</h3>
      </div>

      {/* ── SECTION 1: BLAME LOGIC ── */}
      <DrakeAccordion id="logic" title="Who is at fault?" icon={Scale}>
        <div className="space-y-4">
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-bold">
               <Store size={14} /> <span>Merchant Fault</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Item was already broken in the box.</li>
              <li>Merchant used weak packaging (thin plastic/no tape).</li>
              <li>Merchant sent the wrong size or item.</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold">
               <Truck size={14} /> <span>Runner Fault</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Box is crushed, wet, or torn.</li>
              <li>Runner admitted to dropping the bag.</li>
              <li>Liquid spilled because of rough driving.</li>
            </ul>
          </div>
        </div>
      </DrakeAccordion>

      {/* ── SECTION 2: PROCESS GUIDE ── */}
      <DrakeAccordion id="process" title="How to Refund" icon={Info}>
        <div className="space-y-3">
          <p>1. <span className="text-[#1e293b] font-bold">Check Photos</span>: Compare Merchant Handover photo vs Runner Delivery photo.</p>
          <p>2. <span className="text-[#1e293b] font-bold">Choose the Loser</span>: The one at fault pays for the refund.</p>
          <p>3. <span className="text-[#1e293b] font-bold">Apply Fine</span>: A RM1 service fee is charged to the person at fault.</p>
        </div>
      </DrakeAccordion>

      {/* ── SECTION 3: DECISION SUMMARY (RECEIPT STYLE) ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest pl-1">Final Verdict Preview</p>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#94a3b8]">Refund to Student</span>
            <span className="text-[13px] font-bold text-emerald-600">+ RM 15.00</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#94a3b8]">Penalty Charged To</span>
            <span className="text-[13px] font-bold text-red-500">Merchant</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between bg-white/50">
            <span className="text-[12px] font-bold text-[#1e293b]">Admin Action</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1e293b]">Close Case</span>
          </div>
        </div>
      </div>
      
      <button className="w-full py-4 bg-red-500 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
        <AlertTriangle size={16} /> Execute Verdict
      </button>
    </div>
  );
}
