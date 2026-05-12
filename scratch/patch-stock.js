const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'marketplace', 'create', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const searchStr = '{/* ── SECTION: SMART DOMAIN FIELDS ── */}';
const idx = content.indexOf(searchStr);
if (idx === -1) { console.error('NOT FOUND'); process.exit(1); }

const stockSection = `{/* ── SECTION: STOCK ── */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Stock</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">How many do you have? Set to 0 to mark as sold out.</p>
              </div>
              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-[#1e293b] transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">Qty</span>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none"
                />
              </div>
              {stock !== '' && parseInt(stock, 10) === 0 && (
                <p className="text-[11px] font-bold text-red-400">This listing will be marked as Sold Out immediately.</p>
              )}
            </section>

            `;

content = content.slice(0, idx) + stockSection + content.slice(idx);
fs.writeFileSync(file, content, 'utf8');
console.log('STOCK SECTION INSERTED');
