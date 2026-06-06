const fs = require('fs');
const path = 'app/marketplace/create/page.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  '  comparable?: boolean;\n}',
  "  comparable?: boolean;\n  validation?: {\n    zone: 'green' | 'yellow' | 'red' | 'skipped';\n    canPublish: boolean;\n    message: string;\n    proposedPrice: number;\n    maxCampusPrice: number;\n    marketBaseline: number | null;\n  };\n}"
);

c = c.replace(
  'const isPriceBlocked = !!(marketCheck?.is_enforced && !isNaN(numPrice) && numPrice > marketCheck.max_campus_price);',
  "const isPriceBlocked = !!(marketCheck?.validation?.zone === 'red');"
);

c = c.replace(
  "body: JSON.stringify({ title: t.trim(), category: cat, subcategory: sub }),",
  "body: JSON.stringify({ title: t.trim(), category: cat, subcategory: sub, proposedPrice: p ? parseFloat(p) : undefined, sellerId: auth.currentUser?.uid }),"
);

c = c.replace(
  'const triggerPriceCheck = useCallback(async (t: string, cat: string, sub: string) => {',
  'const triggerPriceCheck = useCallback(async (t: string, cat: string, sub: string, p?: string) => {'
);

c = c.replace(
  'triggerPriceCheck(fullTitle, selectedCategory as string, subcategory);',
  'triggerPriceCheck(fullTitle, selectedCategory as string, subcategory, price);'
);

fs.writeFileSync(path, c);
console.log('replacements done');
console.log('validation present:', c.includes('validation?.zone'));