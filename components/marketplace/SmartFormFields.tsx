'use client'
import React from 'react';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

interface SmartFormFieldsProps {
  categoryId: CategoryID;
  metadata: Record<string, any>;
  onMetadataChange: (key: string, value: any) => void;
  subcategory: string;
  onSubcategoryChange: (value: string) => void;
}

const SPECS_PLACEHOLDERS: Record<string, string> = {
  'Laptops': 'e.g. 16GB RAM, 512GB SSD, Intel i7, 15-inch',
  'Smartphones': 'e.g. 128GB, 6.1-inch, Graphite, Dual SIM',
  'Tablets': 'e.g. 64GB, 11-inch, WiFi + Cellular',
  'Keyboards & Mice': 'e.g. Mechanical, RGB, Wireless, Full-size',
  'Headphones & Audio': 'e.g. Wireless, Noise Cancelling, Over-ear',
  'Cables, Hubs & Chargers': 'e.g. 65W GaN, USB-C, 6 ports, 1.5m',
  'Gaming Consoles & Games': 'e.g. 1TB SSD, 2 controllers, original box',
};

function getBrandOptions(categoryId: CategoryID, subcategory: string): string[] | null {
  const cat = MARKETPLACE_CATEGORIES[categoryId];
  const sub = cat?.subcategories.find(s => s.label === subcategory);
  return sub?.brandOptions ?? null;
}

const SmartFormFields: React.FC<SmartFormFieldsProps> = ({
  categoryId,
  metadata,
  onMetadataChange,
  subcategory,
}) => {
  const category = MARKETPLACE_CATEGORIES[categoryId];
  const fields = category.customFields;

  const isFieldApplicable = (field: typeof fields[number]): boolean => {
    if (!field.applicableSubcategories) return true;
    return field.applicableSubcategories.includes(subcategory);
  };

  const isFieldFilled = (field: typeof fields[number]): boolean => {
    const val = metadata[field.id];
    if (field.id === 'brand' && metadata.brand_custom) return true;
    return val !== undefined && val !== null && val !== '';
  };

  const isFieldVisible = (index: number): boolean => {
    for (let i = 0; i < index; i++) {
      const prev = fields[i];
      if (!isFieldApplicable(prev)) continue;
      if (!isFieldFilled(prev)) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">

      {fields.map((field, index) => {
        if (!isFieldApplicable(field)) return null;
        if (!isFieldVisible(index)) return null;

        // Warranty only shows for BNIB or Like New
        if (field.id === 'warranty' && !['Brand New (Sealed)', 'Like New (< 3 months)'].includes(metadata.condition)) {
          return null;
        }

        const brandOptions = field.id === 'brand' ? getBrandOptions(categoryId, subcategory) : null;
        const options = brandOptions ?? field.options ?? [];
        const specsPlaceholder = field.id === 'specs' && SPECS_PLACEHOLDERS[subcategory]
          ? SPECS_PLACEHOLDERS[subcategory]
          : field.placeholder;

        return (
          <div key={field.id} className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-0.5">
              <p className="text-[14px] font-bold text-slate-900 tracking-tight">{field.label}</p>
              {field.placeholder && field.id !== 'specs' && (
                <p className="text-[11px] font-medium text-[#94a3b8]">{field.placeholder}</p>
              )}
              {field.id === 'specs' && specsPlaceholder && (
                <p className="text-[11px] font-medium text-[#94a3b8]">{specsPlaceholder}</p>
              )}
            </div>

            {field.type === 'text' && (
              <input
                type="text"
                placeholder={specsPlaceholder}
                value={metadata[field.id] || ''}
                onChange={(e) => onMetadataChange(field.id, e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors"
              />
            )}

            {field.type === 'select' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {options.map((opt: string) => {
                    const isActive = metadata[field.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => onMetadataChange(field.id, opt)}
                        className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all active:scale-95 text-[12px] font-bold tracking-[-0.2px] whitespace-nowrap ${
                          isActive
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {metadata[field.id] === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    value={metadata.brand_custom || ''}
                    onChange={(e) => onMetadataChange('brand_custom', e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors"
                    autoFocus
                  />
                )}
              </div>
            )}

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
                        isActive ? 'text-slate-900' : 'text-[#94a3b8]'
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

            {field.type === 'timestamp' && (
              <input
                type="time"
                value={metadata[field.id] || ''}
                onChange={(e) => onMetadataChange(field.id, e.target.value)}
                className="h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
              />
            )}

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
                          ? 'bg-slate-50 border-slate-400 text-slate-900'
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
        );
      })}

    </div>
  );
};

export default SmartFormFields;
