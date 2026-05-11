'use client'
import React from 'react';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';

interface SmartFormFieldsProps {
  domainId: DomainID;
  metadata: Record<string, any>;
  onMetadataChange: (key: string, value: any) => void;
  subcategory: string;
  onSubcategoryChange: (value: string) => void;
}

const SmartFormFields: React.FC<SmartFormFieldsProps> = ({ 
  domainId, 
  metadata, 
  onMetadataChange,
  subcategory,
  onSubcategoryChange
}) => {
  const domain = MARKETPLACE_DOMAINS[domainId];

  return (
    <div className="space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Subcategory Selection */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Classification</h2>
        <div className="flex flex-wrap gap-2">
          {domain.subcategories.map((sub) => (
            <button
              key={sub.label}
              onClick={() => onSubcategoryChange(sub.label)}
              className={`px-6 py-2.5 rounded-3xl border transition-all duration-300 text-[13px] font-bold tracking-tight ${
                subcategory === sub.label 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </section>

      {/* Conditional Fields Divider */}
      <div className="h-[0.5px] bg-slate-100" />

      {/* Domain Specific Fields */}
      <div className="space-y-12">
        {domain.customFields.map((field) => (
          <section key={field.id} className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{field.label}</h2>
            
            {field.type === 'text' && (
              <input
                type="text"
                placeholder={field.placeholder}
                value={metadata[field.id] || ''}
                onChange={(e) => onMetadataChange(field.id, e.target.value)}
                className="w-full bg-transparent text-[22px] font-bold text-slate-900 placeholder:text-slate-100 focus:outline-none tracking-tight"
              />
            )}

            {field.type === 'select' && (
              <div className="flex flex-wrap gap-2">
                {field.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onMetadataChange(field.id, opt)}
                    className={`px-6 py-2.5 rounded-3xl border transition-all duration-300 text-[13px] font-bold tracking-tight ${
                      metadata[field.id] === opt 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {field.type === 'toggle' && (
              <div className="grid grid-cols-1 gap-3">
                {field.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onMetadataChange(field.id, opt)}
                    className={`p-6 rounded-3xl border text-left transition-all duration-300 ${
                      metadata[field.id] === opt 
                        ? 'bg-slate-900 border-slate-900 text-white' 
                        : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <p className="text-[14px] font-bold tracking-tight">{opt}</p>
                  </button>
                ))}
              </div>
            )}

            {field.type === 'timestamp' && (
              <div className="flex items-center gap-4">
                <input
                  type="time"
                  value={metadata[field.id] || ''}
                  onChange={(e) => onMetadataChange(field.id, e.target.value)}
                  className="bg-slate-50 px-6 py-4 rounded-3xl text-[20px] font-bold text-slate-900 focus:outline-none tracking-tight"
                />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Local</span>
              </div>
            )}

            {field.type === 'calendar' && (
              <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center justify-center gap-6">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Available Slots</p>
                 <div className="grid grid-cols-3 gap-2 w-full">
                    {['MORNING', 'AFTERNOON', 'EVENING'].map(slot => (
                       <button
                          key={slot}
                          onClick={() => onMetadataChange(field.id, slot)}
                          className={`h-12 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                             metadata[field.id] === slot ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
                          }`}
                       >
                          {slot}
                       </button>
                    ))}
                 </div>
              </div>
            )}
            
            <div className="h-[0.5px] bg-slate-100 mt-8" />
          </section>
        ))}
      </div>
    </div>
  );
};

export default SmartFormFields;
