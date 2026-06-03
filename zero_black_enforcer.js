const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace blue accents
  content = content.replace(/bg-blue-600/g, 'bg-slate-900');
  content = content.replace(/border-blue-600/g, 'border-slate-900');
  content = content.replace(/text-blue-600/g, 'text-slate-900');
  content = content.replace(/bg-blue-500/g, 'bg-slate-900');
  content = content.replace(/text-blue-500/g, 'text-slate-900');

  // Replace true black with slate-900
  content = content.replace(/#000000/g, 'slate-900');
  content = content.replace(/text-\[#000000\]/g, 'text-slate-900');
  content = content.replace(/bg-\[#000000\]/g, 'bg-slate-900');
  content = content.replace(/ring-\[#000000\]/g, 'ring-slate-900');

  // Also catch tactile feedback if any
  content = content.replace(/active:scale-\[0\.98\]/g, 'active:scale-95');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
