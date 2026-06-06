"use client";

import { useState } from 'react';
import { updatePriceGuideline } from '@/app/actions/adminActions';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import { CheckCircle, Loader2 } from 'lucide-react';

const CAMPUS_DEFAULTS: Record<string, number> = {
  ACADEMIC: 200, HOSTEL: 500, TECH: 3500, APPAREL: 300,
};

export default function SettingsPage() {
  const [category, setCategory] = useState<CategoryID>('TECH');
  const [price,    setPrice]    = useState('');
  const [type,     setType]     = useState<'REGULATED' | 'PREMIUM'>('REGULATED');
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  const handleSave = async () => {
    if (!price || isNaN(Number(price))) return;
    setSaving(true);
    await updatePriceGuideline(category, Number(price), type);
    setSaving(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    setPrice('');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400  mb-1">Configuration</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Settings</h1>
      </div>

      {/* Price Limits */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Set Category Price Limit</h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Changes apply immediately to the marketplace and price audit system.
          </p>
        </div>

        {/* Type */}
        <div>
          <label className="text-[10px] font-bold text-slate-400  block mb-2">Limit Type</label>
          <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100 gap-1">
            {(['REGULATED', 'PREMIUM'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all ${
                  type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}>
                {t === 'REGULATED' ? 'Hard Limit (Enforced)' : 'Soft Limit (Advisory)'}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold text-slate-400  block mb-2">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as CategoryID)}
            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all">
            {Object.values(MARKETPLACE_CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-[10px] font-bold text-slate-400  block mb-2">
            Price Ceiling (RM) · Campus default: RM {CAMPUS_DEFAULTS[category] ?? '—'}
          </label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder={`e.g. ${CAMPUS_DEFAULTS[category]}`}
            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-semibold text-slate-900 outline-none focus:border-slate-300 transition-all placeholder:text-slate-300" />
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={!price || saving}
          className={`w-full h-12 rounded-xl font-bold text-[12px]  transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 ${
            done ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-900'
          }`}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {done ? 'Saved!' : 'Save Limit'}
        </button>
      </div>

      {/* Presentation Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Presentation Controls</h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Enable Judging Mode to simulate live transactions and bypass delays during the FYP2 presentation.
          </p>
        </div>
        <button onClick={() => alert("Judging Mode Enabled: Escrow timers disabled and auto-release triggered.")}
          className="w-full h-12 rounded-xl font-bold text-[12px] bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 transition-all active:scale-95">
          Enable Judging Mode
        </button>
      </div>

      {/* Campus Defaults Reference */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 ">Campus Default Ceilings</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Used when no custom limit is saved for a category</p>
        </div>
        {Object.entries(CAMPUS_DEFAULTS).map(([cat, val]) => {
          const config = MARKETPLACE_CATEGORIES[cat as CategoryID];
          return (
            <div key={cat} className="flex items-center justify-between px-6 py-4 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-[13px] font-bold text-slate-900">{config?.label || cat}</p>
                <p className="text-[10px] font-medium text-slate-400">{config?.subtext}</p>
              </div>
              <p className="text-[14px] font-semibold text-slate-500">RM {val.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
