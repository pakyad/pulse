const fs = require('fs');
const path = 'app/marketplace/create/page.tsx';
let c = fs.readFileSync(path, 'utf8');
let n = 0;
function rep(a, b) { if (!c.includes(a)) { console.log('MISS:', a.slice(0,60)); return; } c = c.replace(a, b); n++; }

rep(
  'const isBlocked = hasPriceInput && marketCheck.is_enforced && numericPrice > marketCheck.max_campus_price;',
  "const isBlocked = marketCheck.validation?.zone === 'red';\n                  const isWarning = marketCheck.validation?.zone === 'yellow';"
);
rep(
  'const isCompliant = hasPriceInput && numericPrice <= marketCheck.max_campus_price;',
  "const isCompliant = marketCheck.validation?.zone === 'green';"
);
rep(
  ": 'bg-slate-50 border-slate-100'",
  ": isWarning\n                          ? 'bg-amber-50/80 border-amber-100'\n                          : 'bg-slate-50 border-slate-100'"
);
rep(
  "isCompliant ? 'border-emerald-100/50 bg-emerald-50/50' :\n                        'border-slate-100'",
  "isCompliant ? 'border-emerald-100/50 bg-emerald-50/50' :\n                        isWarning ? 'border-amber-100/50 bg-amber-50' :\n                        'border-slate-100'"
);
rep(
  "isBlocked ? 'bg-red-100' : isCompliant ? 'bg-emerald-100' : 'bg-slate-100'",
  "isBlocked ? 'bg-red-100' : isCompliant ? 'bg-emerald-100' : isWarning ? 'bg-amber-100' : 'bg-slate-100'"
);
rep(
  ': <Globe size={14} className="text-slate-400" />',
  ': isWarning ? <AlertCircle size={14} className="text-amber-500" /> : <Globe size={14} className="text-slate-400" />'
);
rep(
  "isBlocked ? 'text-red-700' : isCompliant ? 'text-emerald-700' : 'text-slate-600'",
  "isBlocked ? 'text-red-700' : isCompliant ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-slate-600'"
);
rep(
  ": 'Market Intelligence Active'",
  ": isWarning ? 'Fair Price Range' : 'Market Intelligence Active'"
);
rep(
  "${isBlocked ? 'text-red-500' : 'text-emerald-600'}",
  "${isBlocked ? 'text-red-500' : isWarning ? 'text-amber-600' : 'text-emerald-600'}"
);
rep(
  '{/* Blocked message */}\n                       {isBlocked && (',
  '{/* Blocked message */}\n                       {isWarning && (\n                         <div className="px-4 pb-4">\n                           <div className="p-3 bg-amber-100/60 rounded-xl flex gap-2">\n                             <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />\n                             <p className="text-[11px] font-medium text-amber-700 leading-relaxed">\n                               Your price is slightly above the campus ceiling of RM {marketCheck.max_campus_price.toFixed(2)}. Consider lowering it for faster sales.\n                             </p>\n                           </div>\n                         </div>\n                       )}\n                       {isBlocked && ('
);

fs.writeFileSync(path, c);
console.log(n + ' of 10 replacements applied');
console.log('isWarning:', c.includes('isWarning'));