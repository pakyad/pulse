import { NextRequest, NextResponse } from 'next/server';
import { checkMarketPrice } from '@/lib/marketplace/price-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, subcategory } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 4) {
      return NextResponse.json({ error: 'Title too short.' }, { status: 400 });
    }
    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Category required.' }, { status: 400 });
    }
    if (!subcategory || typeof subcategory !== 'string') {
      return NextResponse.json({ error: 'Subcategory required.' }, { status: 400 });
    }

    const result = await checkMarketPrice(title.trim(), category, subcategory);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[/api/marketplace/price-check]', err);
    return NextResponse.json({ error: 'Price check failed.' }, { status: 500 });
  }
}
