const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'components', 'merchant', 'MobileMerchant.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports for Pencil, Trash2, db, deleteDoc
const oldImport = `import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';`;
const newImport = `import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, ShieldCheck, Zap, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';`;

content = content.replace(oldImport, newImport);

// 2. Replace the single button with a group
const searchStr = `<button \n                         onClick={() => toggleItemStatus(item.id, item.status)}\n                         className={\`w-10 h-10 rounded-xl flex items-center justify-center transition-all \${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}\`}\n                      >\n                         {item.status === 'ACTIVE' ? <CheckCircle2 size={18} /> : <Zap size={18} />}\n                      </button>`;

const replacement = `<div className="flex items-center gap-2">
                        <button
                           onClick={() => router.push(\`/marketplace/\${item.id}/edit\`)}
                           title="Edit"
                           className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1e293b] transition-all"
                        >
                           <Pencil size={14} />
                        </button>
                        <button
                           title="Delete"
                           onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }}
                           className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replacement);
  console.log('REPLACED toggle with group');
} else {
  // Try flexible search
  const idx = content.indexOf("toggleItemStatus(item.id, item.status)");
  if (idx === -1) { console.error('Still not found'); process.exit(1); }
  // Find the containing button block
  const btnStart = content.lastIndexOf('<button', idx);
  const btnEnd = content.indexOf('</button>', idx) + '</button>'.length;
  const newBlock = `<div className="flex items-center gap-2">
                        <button
                           onClick={() => router.push(\`/marketplace/\${item.id}/edit\`)}
                           title="Edit"
                           className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1e293b] transition-all"
                        >
                           <Pencil size={14} />
                        </button>
                        <button
                           title="Delete"
                           onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }}
                           className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>`;
  content = content.slice(0, btnStart) + newBlock + content.slice(btnEnd);
  console.log('REPLACED via index search');
}

fs.writeFileSync(file, content, 'utf8');
console.log('MobileMerchant PATCHED');
