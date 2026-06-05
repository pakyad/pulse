/**
 * Pulse Price Intelligence Engine v2.0
 * ─────────────────────────────────────────────────────────────
 * Layer 0: Subcategory gate    — skip API entirely if !comparable
 * Layer 1: Firestore 24hr cache — serve cached result if fresh
 * Layer 2: SerpAPI live         — Google Shopping via serpapi.com
 * Layer 3: Firestore reference  — seeded demo prices
 * Layer 4: Subcategory ceiling  — hardcoded safety net
 */

import { adminDb } from '@/lib/firebase-admin';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

const MULTIPLIER = 0.90; // 10% campus discount mandate
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PriceCheckResult {
  market_baseline: number | null;
  max_campus_price: number;
  source: 'SERP_LIVE' | 'FIRESTORE_CACHE' | 'FIRESTORE_REFERENCE' | 'STATIC_CEILING' | 'NOT_COMPARABLE';
  source_detail: string;
  scraped_at: string;
  is_enforced: boolean;
  comparable: boolean;
}

// ── Input Sanity Guard ───────────────────────────────────────────────────────
function sanitizeTitle(raw: string): string {
  // Normalize: lowercase, collapse spaces, strip non-printable
  return raw.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s\-().&]/g, '');
}

function isMeaningfulTitle(title: string): boolean {
  // Reject: fewer than 10 chars, all same character, no vowels, no spaces at all
  if (title.length < 10) return false;
  if (/^(.)\1+$/.test(title)) return false; // "aaaaaaaaa"
  if (!/[aeiou]/i.test(title)) return false; // "jxbsjbsjbs"
  return true;
}

// ── Layer 1: Firestore 24hr Cache ────────────────────────────────────────────
async function fetchFromCache(cacheKey: string, ignoreAge: boolean = false): Promise<number | null> {
  try {
    const doc = await adminDb.collection('price_cache').doc(cacheKey).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    const age = Date.now() - (data.cached_at?.toMillis?.() ?? 0);
    if (!ignoreAge && age > CACHE_TTL_MS) return null; // Expired for live use
    return data.price as number;
  } catch {
    return null;
  }
}

async function writeToCache(cacheKey: string, price: number): Promise<void> {
  try {
    await adminDb.collection('price_cache').doc(cacheKey).set({
      price,
      cached_at: new Date(),
    });
  } catch (e) {
    console.warn('[PriceEngine] Cache write failed:', e);
  }
}

// ── Layer 2: SerpAPI (Google Shopping) ───────────────────────────────────────
async function fetchFromSerpApi(title: string, serpSuffix?: string): Promise<number | null> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return null;

  const query = encodeURIComponent(`${title} ${serpSuffix || 'Malaysia buy'}`);
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${query}&gl=my&hl=en&currency=MYR&api_key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const results: any[] = data?.shopping_results || [];
    if (!results.length) return null;

    const prices: number[] = results
      .map((r: any) => parseFloat(r.price?.replace(/[^0-9.]/g, '') || ''))
      .filter((p) => !isNaN(p) && p > 1 && p < 50000)
      .sort((a, b) => a - b);

    if (!prices.length) return null;

    // Median of the 5 lowest prices (avoids outlier scam listings)
    const sample = prices.slice(0, Math.min(5, prices.length));
    return parseFloat(sample[Math.floor(sample.length / 2)].toFixed(2));
  } catch (err: any) {
    if (err.name !== 'AbortError') console.error('[PriceEngine] SerpAPI error:', err.message);
    return null;
  }
}

// ── Layer 3: Firestore Seeded Reference ──────────────────────────────────────
async function fetchFromReference(title: string, category: string): Promise<number | null> {
  try {
    const snap = await adminDb.collection('market_reference_prices').where('category', '==', category).get();
    if (snap.empty) return null;

    let bestPrice: number | null = null;
    let bestScore = 0;

    snap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const keywords: string[] = data.keywords || [data.title?.toLowerCase()];
      const score = keywords.filter((kw: string) => title.includes(kw.toLowerCase())).length;
      if (score > bestScore) {
        bestScore = score;
        bestPrice = data.market_price as number;
      }
    });

    return bestPrice;
  } catch {
    return null;
  }
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export async function checkMarketPrice(
  rawTitle: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<PriceCheckResult> {
  const now = new Date().toISOString();
  const category = MARKETPLACE_CATEGORIES[categoryId as CategoryID];
  const subcategory = category?.subcategories.find((s) => s.label === subcategoryLabel);

  // ── Layer 0: Non-comparable subcategory — skip all API calls ─────────────
  if (!subcategory || !subcategory.comparable) {
    const ceiling = subcategory?.fixedCeiling ?? category?.ceiling ?? 100;
    return {
      market_baseline: null,
      max_campus_price: ceiling,
      source: 'NOT_COMPARABLE',
      source_detail: `This item type has a fixed campus ceiling of RM ${ceiling.toFixed(2)}. No open-market benchmark is applicable.`,
      scraped_at: now,
      is_enforced: true,
      comparable: false,
    };
  }

  const title = sanitizeTitle(rawTitle);

  // Reject garbage input before hitting any API
  if (!isMeaningfulTitle(title)) {
    const ceiling = subcategory.fixedCeiling ?? 500;
    return {
      market_baseline: null,
      max_campus_price: ceiling,
      source: 'STATIC_CEILING',
      source_detail: `Item name too vague to benchmark. Category ceiling of RM ${ceiling.toFixed(2)} applies.`,
      scraped_at: now,
      is_enforced: false,
      comparable: true,
    };
  }

  const cacheKey = `${categoryId}_${subcategoryLabel}_${title}`.replace(/\s/g, '_').slice(0, 100);

  // ── Layer 1: 24hr Firestore cache ────────────────────────────────────────
  const cached = await fetchFromCache(cacheKey);
  if (cached) {
    return {
      market_baseline: cached,
      max_campus_price: parseFloat((cached * MULTIPLIER).toFixed(2)),
      source: 'FIRESTORE_CACHE',
      source_detail: `Cached market data (refreshed every 24h). Open market: RM ${cached.toFixed(2)}.`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  // ── Layer 2: SerpAPI live ─────────────────────────────────────────────────
  const livePrice = await fetchFromSerpApi(title, subcategory.serpQuerySuffix);
  if (livePrice) {
    await writeToCache(cacheKey, livePrice); // Cache for next student
    return {
      market_baseline: livePrice,
      max_campus_price: parseFloat((livePrice * MULTIPLIER).toFixed(2)),
      source: 'SERP_LIVE',
      source_detail: `Live price from Google Shopping (Shopee/Lazada) · ${now}`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  // ── Layer 2.5: Historical Memory (Self-Learning Database Fallback) ───────
  // If SerpAPI fails, check the cache AGAIN but ignore the 24h age limit.
  const historicalPrice = await fetchFromCache(cacheKey, true);
  if (historicalPrice) {
    return {
      market_baseline: historicalPrice,
      max_campus_price: parseFloat((historicalPrice * MULTIPLIER).toFixed(2)),
      source: 'FIRESTORE_CACHE',
      source_detail: `Historical market data (older than 24h). Used as fallback due to live API outage.`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  // ── Layer 3: Firestore seeded reference ──────────────────────────────────
  const refPrice = await fetchFromReference(title, categoryId);
  if (refPrice) {
    await writeToCache(cacheKey, refPrice); // Also cache reference hits
    return {
      market_baseline: refPrice,
      max_campus_price: parseFloat((refPrice * MULTIPLIER).toFixed(2)),
      source: 'FIRESTORE_REFERENCE',
      source_detail: 'Verified campus reference pricing. Based on recent Shopee/Lazada research.',
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  // ── Layer 4: Subcategory static ceiling ──────────────────────────────────
  const ceiling = subcategory.fixedCeiling ?? 500;
  return {
    market_baseline: null,
    max_campus_price: ceiling,
    source: 'STATIC_CEILING',
    source_detail: `No market data found for this item. Campus category ceiling of RM ${ceiling.toFixed(2)} applies.`,
    scraped_at: now,
    is_enforced: false,
    comparable: true,
  };
}
