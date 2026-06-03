const fs = require('fs');
const path = require('path');

function fixBrackets(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/text-\[slate-900\]/g, 'text-slate-900');
  content = content.replace(/bg-\[slate-900\]/g, 'bg-slate-900');
  content = content.replace(/ring-\[slate-900\]/g, 'ring-slate-900');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fixBrackets(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
