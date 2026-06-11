import { adminDb } from '@/lib/firebase-admin';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

//  Layer 2.75: AI Market Price Estimation 
// Uses OpenAI (if available) or a rule-based estimator as fallback.
// Catches every edge case: typos, vague titles, short names, obscure items.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

//  Claude estimator 
async function estimateWithClaude(
  title: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<number | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = 'You are a Malaysian campus marketplace price estimator. Estimate a REASONABLE RESALE PRICE for this item in Malaysian Ringgit (MYR). Consider condition hints in the name, typical student budget, and Malaysian market. If the title is vague or has typos, infer the most likely product and estimate accordingly. Return ONLY a number. No explanation, no currency symbol, no punctuation.';
  const userPrompt = `Category: ${categoryId}\nSubcategory: ${subcategoryLabel}\nProduct: ${title}\nPrice:`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 10,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim() || '';
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num < 1 || num > 50000) return null;

    return parseFloat(num.toFixed(2));
  } catch {
    return null;
  }
}

//  MAIN EXPORT 
export async function estimateMarketPrice(
  title: string,
  categoryId: string,
  subcategoryLabel: string
): Promise<{ price: number; source: 'CLAUDE' } | null> {
  const claudePrice = await estimateWithClaude(title, categoryId, subcategoryLabel);
  if (claudePrice !== null) {
    return { price: claudePrice, source: 'CLAUDE' };
  }
  return null;
}
