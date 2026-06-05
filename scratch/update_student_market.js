const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('d:/FYP/Pulse/lib/marketplace/categories.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const studentMarketLabels = [
  'Textbooks',
  'Scientific Calculator',
  'Lab Coat & Safety',
  'Drawing & Art Tools',
  'Stationery Bundles',
  'Fan & Cooling',
  'Kitchen Appliance',
  'Furniture',
  'Storage',
  'Room Misc',
  'Bedding & Linen',
  'Lab Coat',
  'Club / Faculty Shirt',
  'Campus Merch'
];

studentMarketLabels.forEach(label => {
  const regex = new RegExp(`(label:\\s*['"]${label}['"],\\s*\\n\\s*comparable:\\s*(true|false),)`, 'g');
  content = content.replace(regex, `$1\n        studentMarket: true,`);
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated categories.ts with studentMarket flags.');
