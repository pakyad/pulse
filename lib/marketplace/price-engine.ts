/**
 * Pulse Price Intelligence Engine v2.0
 * 
 * Layer 0: Subcategory gate     skip API entirely if !comparable
 * Layer 1: Firestore 24hr cache  serve cached result if fresh
 * Layer 1.5: Fuzzy word-match    Jaccard similarity on tokens (typo-tolerant)
 * Layer 2: SerpAPI live          Google Shopping via serpapi.com
 * Layer 2.5: Historical Memory   expired cache as fallback
 * Layer 2.75: AI estimation      OpenAI + rule-based (catches typos, vague titles)
 * Layer 3: Firestore reference   seeded demo prices
 * Layer 4: Subcategory ceiling   hardcoded safety net
 */

import { adminDb } from '@/lib/firebase-admin';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import { estimateMarketPrice } from './price-engine-ai';

const MULTIPLIER = 0.90; // 10% campus discount mandate
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PriceCheckResult {
  market_baseline: number | null;
  max_campus_price: number;
  source: 'SERP_LIVE' | 'FIRESTORE_CACHE' | 'FIRESTORE_REFERENCE' | 'STATIC_CEILING' | 'NOT_COMPARABLE' | 'AI_ESTIMATE';
  source_detail: string;
  scraped_at: string;
  is_enforced: boolean;
  comparable: boolean;
  zone?: 'green' | 'yellow' | 'red' | 'skipped';
}

//  Input Sanity Guard 
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

//  Cache Key Normaliser 
// Extracts the core product name (strips condition/fluff) for cache sharing,
// but appends a condition tier so "Like New" and "Used" get different lookups.
const FILLER = /\b(a|an|the|for|and|or|of|to|in|on|at|by|is|was|are|with|new|used|like|good|fair|poor|condition|sealed|opened|box|bnib|preloved|grade|cheap|bargain|best|offer|firm|urgent|price|selling|sale|nego|negotiable|free|retail|genuine|original|warranty|local|ready|stock|unit|piece|set|pack)\b/gi;
const SEPARATOR = /\s*[,\-\(]\s*.*/; // strip everything after   , (  (condition info)

function extractConditionTier(raw: string): string {
  const t = raw.toLowerCase();
  if (/\b(new|sealed|bnib|unopened|mint)\b/i.test(t)) return '+NEW';
  if (/\b(like new|like-new|excellent|pristine|barely used|gently used)\b/i.test(t)) return '+LIKE_NEW';
  if (/\b(good|used|preloved|pre-owned|light use)\b/i.test(t)) return '+USED';
  if (/\b(fair|worn|visible wear|scratched|scuffs|damaged)\b/i.test(t)) return '+FAIR';
  if (/\b(for parts|broken|not working|repair|as is|untested)\b/i.test(t)) return '+PARTS';
  return '+DEFAULT';
}

function normalizeForCacheKey(raw: string): string {
  const tier = extractConditionTier(raw);
  const core = raw
    .toLowerCase()
    .replace(SEPARATOR, '')          // strip condition/notes segment
    .replace(FILLER, '')             // strip filler words
    .replace(/[^a-z0-9\s]/g, '')    // strip punctuation
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim()
    .split(' ').filter(Boolean).sort().join('_');
  return `${core}${tier}`;
}

//  Layer 1: Firestore 24hr Cache 
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

async function writeToCache(cacheKey: string, price: number, rawTitle?: string): Promise<void> {
  try {
    const data: Record<string, any> = { price, cached_at: new Date() };
    if (rawTitle) {
      data.tokens = extractTokens(rawTitle);
      const firstSep = cacheKey.indexOf('_');
      const secondSep = cacheKey.indexOf('_', firstSep + 1);
      data.prefix = cacheKey.substring(0, secondSep);
    }
    await adminDb.collection('price_cache').doc(cacheKey).set(data);
  } catch (e) {
    console.warn('[PriceEngine] Cache write failed:', e);
  }
}

//  Token-based fuzzy matching (typo-tolerant cache lookup) 
// Extracts meaningful words (3 chars, excluding filler) from a title.
const TOKEN_FILLER = /\b(a|an|the|for|and|or|of|to|in|on|at|by|is|was|are|with|new|used|like|good|fair|poor|box|set|unit|piece|lot|pack)\b/gi;

function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(TOKEN_FILLER, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length >= 3)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

async function fetchFuzzyFromCache(prefix: string, title: string): Promise<number | null> {
  const queryTokens = extractTokens(title);
  if (queryTokens.length === 0) return null;
  try {
    const snap = await adminDb.collection('price_cache')
      .where('prefix', '==', prefix)
      .where('cached_at', '>=', new Date(Date.now() - CACHE_TTL_MS))
      .get();
    if (snap.empty) return null;
    let bestScore = 0;
    let bestPrice: number | null = null;
    snap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      const docTokens: string[] = data.tokens || extractTokens(doc.id);
      const score = jaccardSimilarity(queryTokens, docTokens);
      if (score > bestScore && score >= 0.35) {
        bestScore = score;
        bestPrice = data.price as number;
      }
    });
    return bestPrice;
  } catch {
    return null;
  }
}

//  Layer 2: SerpAPI (Google Shopping) 
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

//  Layer 3: Firestore Seeded Reference 
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

//  MAIN EXPORT 
export async function checkMarketPrice(
  rawTitle: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<PriceCheckResult> {
  const now = new Date().toISOString();
  const category = MARKETPLACE_CATEGORIES[categoryId as CategoryID];
  const subcategory = category?.subcategories.find((s) => s.label === subcategoryLabel);

  //  Layer 0: Non-comparable subcategory  skip all API calls 
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

  // Try AI estimation for short/vague titles (SerpAPI can't handle these)
  if (!isMeaningfulTitle(title)) {
    const aiResult = await estimateMarketPrice(rawTitle, categoryId, subcategoryLabel);
    if (aiResult) {
      const cacheKeyShort = `${categoryId}_${subcategoryLabel}_${normalizeForCacheKey(rawTitle)}`.slice(0, 120);
      await writeToCache(cacheKeyShort, aiResult.price, rawTitle);
      return {
        market_baseline: aiResult.price,
        max_campus_price: parseFloat((aiResult.price * MULTIPLIER).toFixed(2)),
        source: 'AI_ESTIMATE',
        source_detail: `AI estimated from "${rawTitle}". Market price: RM ${aiResult.price.toFixed(2)} (${aiResult.source}).`,
        scraped_at: now,
        is_enforced: true,
        comparable: true,
      };
    }
    // AI also failed  fall back to ceiling
    const ceiling = subcategory.fixedCeiling ?? 500;
    return {
      market_baseline: null,
      max_campus_price: ceiling,
      source: 'STATIC_CEILING',
      source_detail: `Item name too vague to benchmark. Category ceiling of RM ${ceiling.toFixed(2)} applies.`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  const cacheKey = `${categoryId}_${subcategoryLabel}_${normalizeForCacheKey(title)}`.slice(0, 120);

  //  Layer 1: 24hr Firestore cache 
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

  //  Layer 1.5: Fuzzy token match (typo-tolerant cache share) 
  const prefix = `${categoryId}_${subcategoryLabel}`;
  const fuzzyPrice = await fetchFuzzyFromCache(prefix, rawTitle);
  if (fuzzyPrice) {
    return {
      market_baseline: fuzzyPrice,
      max_campus_price: parseFloat((fuzzyPrice * MULTIPLIER).toFixed(2)),
      source: 'FIRESTORE_CACHE',
      source_detail: `Fuzzy-matched to similar cached item. Market price: RM ${fuzzyPrice.toFixed(2)}.`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  //  Layer 2: SerpAPI live 
  const livePrice = await fetchFromSerpApi(title, subcategory.serpQuerySuffix);
  if (livePrice) {
    await writeToCache(cacheKey, livePrice, rawTitle); // Cache for next student
    return {
      market_baseline: livePrice,
      max_campus_price: parseFloat((livePrice * MULTIPLIER).toFixed(2)),
      source: 'SERP_LIVE',
      source_detail: `Live price from Google Shopping  ${now}`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  //  Layer 2.5: Historical Memory (Self-Learning Database Fallback) 
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

  //  Layer 2.75: AI estimation (catches what SerpAPI misses) 
  const aiResult = await estimateMarketPrice(rawTitle, categoryId, subcategoryLabel);
  if (aiResult) {
    await writeToCache(cacheKey, aiResult.price, rawTitle);
    return {
      market_baseline: aiResult.price,
      max_campus_price: parseFloat((aiResult.price * MULTIPLIER).toFixed(2)),
      source: 'AI_ESTIMATE',
      source_detail: `AI estimated price from "${rawTitle}". Market: RM ${aiResult.price.toFixed(2)} (${aiResult.source}).`,
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  //  Layer 3: Firestore seeded reference 
  const refPrice = await fetchFromReference(title, categoryId);
  if (refPrice) {
    await writeToCache(cacheKey, refPrice, rawTitle); // Also cache reference hits
    return {
      market_baseline: refPrice,
      max_campus_price: parseFloat((refPrice * MULTIPLIER).toFixed(2)),
      source: 'FIRESTORE_REFERENCE',
      source_detail: 'Verified campus reference pricing. Based on recent online market research.',
      scraped_at: now,
      is_enforced: true,
      comparable: true,
    };
  }

  //  Layer 4: Subcategory static ceiling 
  const ceiling = subcategory.fixedCeiling ?? 500;
  return {
    market_baseline: null,
    max_campus_price: ceiling,
    source: 'STATIC_CEILING',
    source_detail: `No market data found for this item. Campus category ceiling of RM ${ceiling.toFixed(2)} applies.`,
    scraped_at: now,
    is_enforced: true,
    comparable: true,
  };
}

//  Zone Validator + Trust Score 
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
    message = `Your price is slightly above our suggestion of RM ${max.toFixed(2)}. Listings priced lower sell faster.`;
  } else {
    zone = 'red';
    canPublish = false;
    message = `Your price exceeds the market rate. Lower to RM ${max.toFixed(2)} to publish in the Student Marketplace.`;
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
