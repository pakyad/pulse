const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next' || file === '.git') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./app').concat(walk('./components'));
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Audit colors
    content = content.replace(/bg-blue-600/g, 'bg-slate-900');
    content = content.replace(/bg-blue-500/g, 'bg-slate-900');
    content = content.replace(/bg-\[\#111111\]/g, 'bg-slate-900');
    content = content.replace(/bg-\[\#000000\]/g, 'bg-slate-900');
    content = content.replace(/bg-black/g, 'bg-slate-900');
    
    // Shadows
    content = content.replace(/shadow-blue-600\/(\d+)/g, 'shadow-slate-900/10');
    content = content.replace(/shadow-blue-500\/(\d+)/g, 'shadow-slate-900/10');
    content = content.replace(/shadow-black\/(\d+)/g, 'shadow-slate-900/10');

    // Text colors
    content = content.replace(/text-\[\#111111\]/g, 'text-slate-900');
    content = content.replace(/text-black/g, 'text-slate-900');
    
    // Hover states
    content = content.replace(/hover:bg-black/g, 'hover:bg-slate-800');
    content = content.replace(/hover:bg-\[\#111111\]/g, 'hover:bg-slate-800');
    
    // 2. Enforce Buttering (Typography)
    content = content.replace(/uppercase tracking-widest font-black/g, 'font-semibold');
    content = content.replace(/uppercase tracking-\[0\.2em\]/g, '');
    content = content.replace(/font-black uppercase tracking-widest/g, 'font-semibold');
    content = content.replace(/font-black uppercase tracking-wider/g, 'font-semibold');
    content = content.replace(/uppercase tracking-widest/g, '');
    content = content.replace(/text-\[10px\] font-black text-slate-400 uppercase tracking-widest/g, 'text-[12px] font-semibold text-slate-500');
    content = content.replace(/font-black/g, 'font-semibold'); // soften all font-black to font-semibold
    
    // 3. Butter the border radius of big buttons (rounded-2xl is fine, but maybe rounded-xl to rounded-[16px])
    // Only replacing specific known harsh corners if any, but let's stick to typography and colors for this audit
    
    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log('Audited:', file);
    }
});
console.log('Audited ' + modifiedCount + ' files.');
