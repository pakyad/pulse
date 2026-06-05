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

    // Revert #2A5C50 back to slate-900
    content = content.replace(/bg-\[\#2A5C50\]/g, 'bg-slate-900');
    content = content.replace(/shadow-\[\#2A5C50\]\/20/g, 'shadow-slate-900/10');
    content = content.replace(/text-\[\#2A5C50\]/g, 'text-slate-900');
    content = content.replace(/ring-\[\#2A5C50\]/g, 'ring-slate-900');
    content = content.replace(/border-\[\#2A5C50\]/g, 'border-slate-900');
    content = content.replace(/rgba\(42,92,80,0\.25\)/g, 'rgba(0,0,0,0.08)');
    content = content.replace(/#2A5C50/g, 'slate-900');

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log('Reverted:', file);
    }
});
console.log('Reverted ' + modifiedCount + ' files.');
