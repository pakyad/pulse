const fs = require('fs');

const path = 'd:\\FYP\\Pulse\\app\\admin\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "if (activeSubTab === 'RUNNER') return u.is_verified_runner;",
  "if (activeSubTab === 'RUNNER') return u.is_verified_runner || u.runner_status === 'pending';"
);
content = content.replace(
  "if (activeSubTab === 'MERCHANT') return u.is_seller;",
  "if (activeSubTab === 'MERCHANT') return u.is_seller || u.merchant_status === 'pending';"
);
content = content.replace(
  "if (activeSubTab === 'STUDENT') return !u.is_verified_runner && !u.is_seller;",
  "if (activeSubTab === 'STUDENT') return !u.is_verified_runner && !u.is_seller && u.runner_status !== 'pending' && u.merchant_status !== 'pending';"
);

content = content.replace(
  "{u.is_verified_runner && <span className=\"px-2.5 py-1 bg-[#1C1C1E] text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><ShieldCheck size={10} /> Runner</span>}",
  "{u.runner_status === 'pending' && !u.is_verified_runner && <span className=\"px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><Clock size={10} /> Pending Runner</span>}\n                                     {u.is_verified_runner && <span className=\"px-2.5 py-1 bg-[#1C1C1E] text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><ShieldCheck size={10} /> Runner</span>}"
);
content = content.replace(
  "{u.is_seller && <span className=\"px-2.5 py-1 bg-blue-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><Briefcase size={10} /> Merchant</span>}",
  "{u.merchant_status === 'pending' && !u.is_seller && <span className=\"px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><Clock size={10} /> Pending Merchant</span>}\n                                     {u.is_seller && <span className=\"px-2.5 py-1 bg-blue-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5\"><Briefcase size={10} /> Merchant</span>}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
