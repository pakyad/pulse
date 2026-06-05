import { NextResponse } from 'next/server';

/**
 * Pulse Price Intelligence Engine (Phase 2)
 * Simulated SerpAPI / Google Shopping Aggregator for FYP Presentation.
 * This middleware calculates the MARKET_BASELINE and the Fair-Trade Max_Allowed_Price.
 */

// Simulated database of external retail prices for presentation reliability
const RETAIL_BENCHMARKS: Record<string, number> = {
  'calculator': 95.00,
  'fx-570': 95.00,
  'fx-991': 130.00,
  'ti-84': 600.00,
  'lab coat': 45.00,
  'goggles': 15.00,
  'arduino': 85.00,
  'raspberry': 350.00,
  'textbook': 120.00,
  'calculus': 150.00,
  'pen': 12.00,
  'fan': 65.00,
  'kettle': 40.00,
  'wardrobe': 55.00,
  'storage': 40.00,
  'bedsheet': 35.00,
  'hoodie': 80.00,
  'jacket': 90.00
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
    }

    // Simulate network delay for realism (API fetching)
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedTitle = title.toLowerCase();
    let baseline = 0;

    // Tokenize title and find the most expensive match in our benchmark
    // In a real SerpAPI implementation, this would send the query to Google Shopping
    // and calculate the median of the top 5 lowest valid results.
    for (const [key, price] of Object.entries(RETAIL_BENCHMARKS)) {
      if (normalizedTitle.includes(key)) {
        if (price > baseline) baseline = price;
      }
    }

    // Fallback logic if no keyword matches: Generate a realistic mathematical hash baseline
    if (baseline === 0) {
      // Create a deterministic hash based on the string length to always return the same price for the same title
      const hash = normalizedTitle.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      // Generate a price between 30 and 150
      baseline = 30 + (hash % 120);
    }

    // ── Dynamic Campus Margin Logic ──
    // High ticket items (> RM200) get a 5% margin to remain attractive.
    // Standard commodities get the strict 10% margin.
    const discountFactor = baseline >= 200 ? 0.95 : 0.90;
    
    // Calculate Max Allowed
    const maxAllowed = Math.floor(baseline * discountFactor);

    return NextResponse.json({
      success: true,
      data: {
        title: title,
        baseline: baseline,
        maxAllowed: maxAllowed,
        marginApplied: baseline >= 200 ? '5%' : '10%',
        source: 'Shopee/Lazada Median (Simulated)'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
