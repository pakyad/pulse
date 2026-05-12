const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'components', 'merchant', 'DesktopMerchant.tsx');
let content = fs.readFileSync(file, 'utf8');

const searchStr = '/* 🛠️ Subtle Control Node */';
const idx = content.indexOf(searchStr);

if (idx === -1) {
  console.error('Search string not found!');
  process.exit(1);
}

// Find the button block: from the comment start to closing </button>
const commentLineStart = content.lastIndexOf('\n', idx);
const buttonClose = '</button>';
const buttonCloseIdx = content.indexOf(buttonClose, idx) + buttonClose.length;

const replacement = `
                             {/* 🛠️ Control Nodes */}
                             <div className="flex items-center gap-2 shrink-0">
                                <button
                                   onClick={() => toggleItemStatus(item.id, item.status)}
                                   className={\`h-10 px-5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all \${
                                      item.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 border-[0.5px] border-emerald-100'
                                      : 'bg-slate-50 text-slate-300 border-[0.5px] border-slate-100'
                                   }\`}
                                >
                                   {item.status === 'active' ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                   onClick={() => router.push(\`/marketplace/\${item.id}/edit\`)}
                                   title="Edit listing"
                                   className="h-10 w-10 rounded-[16px] bg-slate-50 border-[0.5px] border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1e293b] hover:border-slate-300 transition-all"
                                >
                                   <Pencil size={14} />
                                </button>
                                <button
                                   title="Delete listing"
                                   onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed to delete.'); } }}
                                   className="h-10 w-10 rounded-[16px] bg-red-50 border-[0.5px] border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 hover:border-red-300 transition-all"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>`;

content = content.slice(0, commentLineStart) + replacement + content.slice(buttonCloseIdx);
fs.writeFileSync(file, content, 'utf8');
console.log('PATCHED OK');
