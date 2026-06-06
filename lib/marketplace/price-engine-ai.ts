import { adminDb } from '@/lib/firebase-admin';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

// ── Layer 2.75: AI Market Price Estimation ─────────────────────────────────
// Uses OpenAI (if available) or a rule-based estimator as fallback.
// Catches every edge case: typos, vague titles, short names, obscure items.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── OpenAI estimator ───────────────────────────────────────────────────────
async function estimateWithOpenAI(
  title: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<number | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    'You are a Malaysian campus marketplace price estimator. Estimate a REASONABLE RESALE PRICE for this item in Malaysian Ringgit (MYR).',
    'Consider: condition hints in the name, typical student budget, and Malaysian market.',
    'If the title is vague or has typos, infer the most likely product and estimate accordingly.',
    'Return ONLY a number. No explanation, no currency symbol, no punctuation.',
    '',
    `Category: ${categoryId}`,
    `Subcategory: ${subcategoryLabel}`,
    `Product: ${title}`,
    'Price:',
  ].join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || '';
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num < 1 || num > 50000) return null;

    return parseFloat(num.toFixed(2));
  } catch {
    return null;
  }
}

// ── Rule-based estimator (always available, no API key needed) ─────────────
async function estimateWithRules(
  title: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<number | null> {
  const category = MARKETPLACE_CATEGORIES[categoryId as CategoryID];
  const subcategory = category?.subcategories.find(s => s.label === subcategoryLabel);
  const ceiling = subcategory?.fixedCeiling ?? category?.ceiling ?? 100;

  // 1. Try to find a median price from ALL cached prices in this subcategory
  const prefix = `${categoryId}_${subcategoryLabel}`;
  try {
    const snap = await adminDb.collection('price_cache')
      .where('prefix', '==', prefix)
      .where('cached_at', '>=', new Date(Date.now() - CACHE_TTL_MS))
      .get();

    if (!snap.empty) {
      const prices: number[] = [];
      snap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const p = doc.data().price as number;
        if (p && p > 1 && p < 50000) prices.push(p);
      });
      if (prices.length >= 3) {
        prices.sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        return parseFloat(median.toFixed(2));
      }
      // With 1-2 prices, use the average
      if (prices.length > 0) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return parseFloat(avg.toFixed(2));
      }
    }
  } catch {
    // Fall through to ceiling-based estimate
  }

  // 2. No cache data — estimate from ceiling
  // Condition-based multiplier from title keywords
  const lowerTitle = title.toLowerCase();
  let multiplier = 0.7; // default: 70% of ceiling (typical used price)

  if (/\b(new|sealed|bnib|unopened|mint)\b/i.test(lowerTitle)) {
    multiplier = 0.9; // 90% of ceiling
  } else if (/\b(like new|like-new|excellent|pristine|barely used)\b/i.test(lowerTitle)) {
    multiplier = 0.75;
  } else if (/\b(good|used|preloved)\b/i.test(lowerTitle)) {
    multiplier = 0.6;
  } else if (/\b(fair|worn|damaged|scratched|for parts|broken)\b/i.test(lowerTitle)) {
    multiplier = 0.4;
  }

  const estimate = parseFloat((ceiling * multiplier).toFixed(2));

  // If estimate is less than RM 5, use 50% of ceiling as minimum
  if (estimate < 5) return parseFloat((ceiling * 0.5).toFixed(2));

  return estimate;
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export async function estimateMarketPrice(
  title: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<{ price: number; source: 'OPENAI' | 'RULE_BASED' } | null> {
  // Try OpenAI first (if key is configured)
  const openaiPrice = await estimateWithOpenAI(title, categoryId, subcategoryLabel);
  if (openaiPrice !== null) {
    return { price: openaiPrice, source: 'OPENAI' };
  }

  // Fallback to rule-based
  const rulePrice = await estimateWithRules(title, categoryId, subcategoryLabel);
  if (rulePrice !== null) {
    return { price: rulePrice, source: 'RULE_BASED' };
  }

  return null;
}
