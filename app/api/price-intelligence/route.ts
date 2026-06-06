import { NextResponse } from 'next/server';
import { checkMarketPrice } from '@/lib/marketplace/price-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, subcategory } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Missing category parameter' }, { status: 400 });
    }

    const result = await checkMarketPrice(title, category, subcategory || '');

    return NextResponse.json({
      success: true,
      data: {
        title,
        baseline: result.market_baseline,
        maxAllowed: result.max_campus_price,
        marginApplied: result.comparable
          ? (result.market_baseline ? '10%' : 'Static Ceiling')
          : 'Not Comparable',
        source: result.source_detail,
        is_enforced: result.is_enforced,
        comparable: result.comparable,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
