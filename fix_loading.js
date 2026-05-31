const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFiles() {
  const dirs = ['d:\\FYP\\Pulse\\app', 'd:\\FYP\\Pulse\\components'];
  
  dirs.forEach(dir => {
    walkDir(dir, function(filePath) {
      if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // 1. Add animate-pulse to obvious skeleton blocks or bg placeholders
        // If a div is just a bg-slate-50 or 100 without content acting as a placeholder
        // Actually, safer is to replace specific loading text.
        
        // Let's replace >Loading...< with an animated loader
        // Since we don't know if Loader2 is imported everywhere, we can just use a simple CSS spinner
        content = content.replace(/>Loading\.\.\.</g, '><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div><');
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('Updated', filePath);
        }
      }
    });
  });
}

processFiles();
