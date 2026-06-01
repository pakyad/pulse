/**
 * Pulse Market Governance Engine v2.0
 * "Trust-First, Flag-Second" — Inspired by Airbnb Smart Pricing + Carousell Price Insights
 *
 * Philosophy:
 *  - Sellers are NEVER blocked. They are INFORMED.
 *  - The platform auto-flags egregious prices (>150% ceiling) algorithmically.
 *  - Community reports add a second signal layer.
 *  - Reviewer only handles flagged cases — not every listing.
 */

import { db } from '@/lib/firebase';
import {
  collection, addDoc, serverTimestamp,
  doc, updateDoc, increment, getDoc
} from 'firebase/firestore';
import { MARKETPLACE_CATEGORIES, CategoryID } from './domains';

// ── TYPES ──────────────────────────────────────────────────────────────────────

export type PriceTier = 'COMPLIANT' | 'ADVISORY' | 'AUTO_FLAG';

export interface PriceIntelligence {
  tier: PriceTier;
  ceiling: number | null;
  rangeMin: number | null;
  rangeMax: number | null;
  overPercentage: number;         // How many % above ceiling (0 if compliant)
  message: string;
  subMessage: string;
  shouldAutoFlag: boolean;        // True if price > ceiling * 1.5
}

// ── CORE ENGINE ────────────────────────────────────────────────────────────────

/**
 * Analyses a price against the category ceiling and returns intelligence.
 * This is ADVISORY ONLY — it never blocks submission.
 */
export function analysePrice(
  price: number,
  categoryId: CategoryID | '',
  subcategory: string
): PriceIntelligence {
  const empty: PriceIntelligence = {
    tier: 'COMPLIANT',
    ceiling: null,
    rangeMin: null,
    rangeMax: null,
    overPercentage: 0,
    message: '',
    subMessage: '',
    shouldAutoFlag: false,
  };

  if (!categoryId || !price || price <= 0) return empty;

  const category = MARKETPLACE_CATEGORIES[categoryId as CategoryID];
  if (!category) return empty;

  const subConfig = category.subcategories.find((s: any) => s.label === subcategory);
  const ceiling = subConfig?.ceiling || category.ceiling;

  if (!ceiling) return { ...empty, tier: 'COMPLIANT' };

  // Campus range: 50–90% of ceiling (typical healthy pricing zone)
  const rangeMin = parseFloat((ceiling * 0.5).toFixed(2));
  const rangeMax = parseFloat((ceiling * 0.9).toFixed(2));
  const ratio = price / ceiling;
  const overPercentage = Math.max(0, Math.round((ratio - 1) * 100));

  // Tier classification:
  //   COMPLIANT    → price ≤ ceiling
  //   ADVISORY     → ceiling < price ≤ ceiling × 1.5  (warn but allow)
  //   AUTO_FLAG    → price > ceiling × 1.5             (allow + auto-flag for reviewer)

  if (ratio <= 1.0) {
    let subMessage = `Typical range: RM ${rangeMin.toFixed(2)} – RM ${rangeMax.toFixed(2)}. You're in a great spot.`;
    if (price > rangeMax) {
      subMessage = `Typical range: RM ${rangeMin.toFixed(2)} – RM ${rangeMax.toFixed(2)}. You're slightly above average, but fully compliant.`;
    } else if (price < rangeMin) {
      subMessage = `Typical range: RM ${rangeMin.toFixed(2)} – RM ${rangeMax.toFixed(2)}. Your price is extremely competitive!`;
    }

    return {
      tier: 'COMPLIANT',
      ceiling,
      rangeMin,
      rangeMax,
      overPercentage: 0,
      message: '✓ Campus-friendly price',
      subMessage,
      shouldAutoFlag: false,
    };
  } else if (ratio <= 1.5) {
    return {
      tier: 'ADVISORY',
      ceiling,
      rangeMin,
      rangeMax,
      overPercentage,
      message: 'Above the typical campus range',
      subMessage: `Campus range: RM ${rangeMin}–${rangeMax}. You can still list, but buyers may compare elsewhere.`,
      shouldAutoFlag: false,
    };
  } else {
    return {
      tier: 'AUTO_FLAG',
      ceiling,
      rangeMin,
      rangeMax,
      overPercentage,
      message: `${overPercentage}% above campus ceiling`,
      subMessage: `Campus ceiling: RM ${ceiling.toFixed(2)}. This will be listed, but flagged for market review.`,
      shouldAutoFlag: true,
    };
  }
}

// ── PRICE REPORT ────────────────────────────────────────────────────────────────

/**
 * Buyer submits a price report on a listing.
 * Report is only actionable after reaching the MIN_REPORTS_THRESHOLD.
 */
export const MIN_REPORTS_THRESHOLD = 3; // Need 3 unique reporters to trigger review

export async function submitPriceReport(
  itemId: string,
  reporterId: string,
  sellerId: string,
  reason: 'OVERPRICED' | 'MISLEADING_DESCRIPTION' | 'WRONG_CATEGORY',
  note?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Write the report document
    await addDoc(collection(db, 'price_reports'), {
      item_id: itemId,
      reporter_id: reporterId,
      seller_id: sellerId,
      reason,
      note: note || '',
      flag_source: 'COMMUNITY',
      status: 'PENDING',
      created_at: serverTimestamp(),
    });

    // 2. Increment flag count on the item
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, {
      price_flag_count: increment(1),
    });

    // 3. Check if threshold reached — if so, mark as flagged
    const itemSnap = await getDoc(itemRef);
    const flagCount = (itemSnap.data()?.price_flag_count || 0);

    if (flagCount >= MIN_REPORTS_THRESHOLD) {
      await updateDoc(itemRef, {
        is_community_flagged: true,
        flag_source: 'COMMUNITY',
      });
    }

    return { success: true, message: 'Report submitted. Thank you for keeping Pulse fair.' };
  } catch (e) {
    console.error('[Governance] Report submission failed:', e);
    return { success: false, message: 'Could not submit report. Please try again.' };
  }
}
