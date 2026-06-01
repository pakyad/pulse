'use client'
import React from 'react';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/domains';

interface SmartFormFieldsProps {
  categoryId: CategoryID;
  metadata: Record<string, any>;
  onMetadataChange: (key: string, value: any) => void;
  subcategory: string;
  onSubcategoryChange: (value: string) => void;
}

const SmartFormFields: React.FC<SmartFormFieldsProps> = ({
  categoryId,
  metadata,
  onMetadataChange,
  subcategory,
  onSubcategoryChange,
}) => {
  const category = MARKETPLACE_CATEGORIES[categoryId];

  return (
    <div className="space-y-6">

      {/* ── Subcategory ── */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-[14px] font-bold text-[#000000] tracking-tight">Subcategory</p>
          <p className="text-[11px] font-medium text-[#94a3b8]">Pick the most specific match.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {category.subcategories.map((sub) => {
            const isActive = subcategory === sub.label;
            return (
              <button
                key={sub.label}
                onClick={() => onSubcategoryChange(sub.label)}
                className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all active:scale-95 text-[12px] font-bold tracking-[-0.2px] whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-50 border-slate-400 text-[#000000]'
                    : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category-specific fields ── */}
      {category.customFields.map((field) => (
        <div key={field.id} className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-0.5">
            <p className="text-[14px] font-bold text-[#000000] tracking-tight">{field.label}</p>
            {field.placeholder && (
              <p className="text-[11px] font-medium text-[#94a3b8]">{field.placeholder}</p>
            )}
          </div>

          {/* text input */}
          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder}
              value={metadata[field.id] || ''}
              onChange={(e) => onMetadataChange(field.id, e.target.value)}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#000000] placeholder:text-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
            />
          )}

          {/* select — horizontal pill buttons */}
          {field.type === 'select' && (
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const isActive = metadata[field.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => onMetadataChange(field.id, opt)}
                    className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all active:scale-95 text-[12px] font-bold tracking-[-0.2px] whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-50 border-slate-400 text-[#000000]'
                        : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* toggle — vertical stacked rows */}
          {field.type === 'toggle' && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {field.options?.map((opt) => {
                const isActive = metadata[field.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => onMetadataChange(field.id, opt)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
                      isActive ? 'bg-white' : 'hover:bg-white/60'
                    }`}
                  >
                    <span className={`text-[13px] font-bold transition-colors ${
                      isActive ? 'text-[#000000]' : 'text-[#94a3b8]'
                    }`}>
                      {opt}
                    </span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* timestamp — time input */}
          {field.type === 'timestamp' && (
            <input
              type="time"
              value={metadata[field.id] || ''}
              onChange={(e) => onMetadataChange(field.id, e.target.value)}
              className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#000000] focus:outline-none focus:border-blue-600 transition-colors"
            />
          )}

          {/* calendar — time slot multi-select pills */}
          {field.type === 'calendar' && (
            <div className="flex gap-2">
              {['Morning', 'Afternoon', 'Evening'].map((slot) => {
                const isActive = metadata[field.id] === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => onMetadataChange(field.id, slot)}
                    className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all active:scale-95 text-[12px] font-bold tracking-[-0.2px] whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-50 border-slate-400 text-[#000000]'
                        : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      ))}

    </div>
  );
};

export default SmartFormFields;
