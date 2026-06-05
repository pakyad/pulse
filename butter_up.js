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

    // 1. Replace bg-slate-900 with bg-[#2A5C50] inside classNames
    content = content.replace(/bg-slate-900/g, 'bg-[#2A5C50]');
    
    // 2. Replace slate-900/10 shadows to #2A5C50/20
    content = content.replace(/shadow-slate-900\/(\d+)/g, 'shadow-[#2A5C50]/20');
    content = content.replace(/shadow-\[slate-900\]\/(\d+)/g, 'shadow-[#2A5C50]/20');

    // 3. Replace uppercase tracking-widest with sentence case mature typography
    content = content.replace(/uppercase tracking-widest font-black/g, 'font-semibold');
    content = content.replace(/uppercase tracking-\[0\.2em\]/g, '');
    content = content.replace(/font-black uppercase tracking-widest/g, 'font-semibold');
    content = content.replace(/font-black uppercase tracking-wider/g, 'font-semibold');
    content = content.replace(/uppercase tracking-widest/g, '');
    content = content.replace(/text-\[10px\] font-black text-slate-400 uppercase tracking-widest/g, 'text-[12px] font-semibold text-slate-500');

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log("Updated:", file);
    }
});

console.log(`Updated ${modifiedCount} files.`);
