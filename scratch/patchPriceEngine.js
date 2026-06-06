const fs = require('fs');
const path = 'lib/marketplace/price-engine.ts';
let content = fs.readFileSync(path, 'utf8');

// Change 1: Add zone field to interface
content = content.replace(
  '  comparable: boolean;\n}',
  "  comparable: boolean;\n  zone?: 'green' | 'yellow' | 'red' | 'skipped';\n}"
);

// Change 2: Append zone validator + trust score
const addition = `
// ── Zone Validator + Trust Score ──────────────────────────────────────────────
export interface ZoneResult {
  zone: 'green' | 'yellow' | 'red' | 'skipped';
  canPublish: boolean;
  message: string;
  proposedPrice: number;
  maxCampusPrice: number;
  marketBaseline: number | null;
}

export async function validatePriceZone(
  proposedPrice: number,
  priceCheck: PriceCheckResult,
  sellerId?: string
): Promise<ZoneResult> {
  if (!priceCheck.comparable || priceCheck.source === 'NOT_COMPARABLE') {
    return {
      zone: 'skipped',
      canPublish: true,
      message: 'Price control does not apply to this category.',
      proposedPrice,
      maxCampusPrice: priceCheck.max_campus_price,
      marketBaseline: priceCheck.market_baseline,
    };
  }

  const max = priceCheck.max_campus_price;
  const baseline = priceCheck.market_baseline;
  let zone: 'green' | 'yellow' | 'red';
  let canPublish: boolean;
  let message: string;

  if (proposedPrice <= max) {
    zone = 'green';
    canPublish = true;
    message = 'Great price! Your listing is ready to go live.';
  } else if (baseline !== null && proposedPrice <= baseline) {
    zone = 'yellow';
    canPublish = true;
    message = \`Your price is slightly above our suggestion of RM \${max.toFixed(2)}. Listings priced lower sell faster.\`;
  } else {
    zone = 'red';
    canPublish = false;
    message = \`Your price exceeds the market rate. Lower to RM \${max.toFixed(2)} to publish in the Student Marketplace.\`;
  }

  if (sellerId) {
    updateTrustScore(sellerId, zone).catch((e) =>
      console.warn('[PriceEngine] Trust score update failed:', e)
    );
  }

  return { zone, canPublish, message, proposedPrice, maxCampusPrice: max, marketBaseline: baseline };
}

async function updateTrustScore(sellerId: string, zone: 'green' | 'yellow' | 'red') {
  try {
    const ref = adminDb.collection('sellerTrustScores').doc(sellerId);
    const doc = await ref.get();
    const d = doc.exists ? doc.data()! : { greenCount: 0, yellowCount: 0, redCount: 0 };
    const green  = (d.greenCount  ?? 0) + (zone === 'green'  ? 1 : 0);
    const yellow = (d.yellowCount ?? 0) + (zone === 'yellow' ? 1 : 0);
    const red    = (d.redCount    ?? 0) + (zone === 'red'    ? 1 : 0);
    const total  = green + yellow + red;
    const score  = total === 0 ? 100 : Math.round(((green + yellow * 0.5) / total) * 100);
    await ref.set(
      { sellerId, score, greenCount: green, yellowCount: yellow, redCount: red, lastUpdated: new Date() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[PriceEngine] Trust score write failed:', e);
  }
}
`;

if (content.includes('validatePriceZone')) {
  console.log('already patched — skipping');
} else {
  content += addition;
}

fs.writeFileSync(path, content);
console.log('done — price-engine.ts patched');
