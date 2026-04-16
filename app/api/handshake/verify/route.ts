import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tx_id, runner_id, claim_token, verification_mode, photo_url } = body;

    // 1. Basic Validation
    if (!tx_id || !runner_id || !verification_mode) {
      return NextResponse.json({ error: "Mission parameters missing" }, { status: 400 });
    }

    // 2. Validate current transaction status
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('claim_token, status')
      .eq('id', tx_id)
      .single();

    if (txError || !tx) {
      return NextResponse.json({ error: "Transaction identity not found" }, { status: 404 });
    }

    if (tx.status !== 'PENDING' && tx.status !== 'DROPPED') {
      return NextResponse.json({ error: "This handshake is already finalized" }, { status: 400 });
    }

    // ⚡ SCENARIO A: Physical Handshake (QR Scan)
    if (verification_mode === 'QR') {
      if (tx.claim_token !== claim_token) {
        return NextResponse.json({ error: "Handshake Token Mismatch. Verification Denied." }, { status: 401 });
      }
      
      // Update Database - Instant Completion
      const { error: collectError } = await supabase
        .from('transactions')
        .update({ status: 'COLLECTED' })
        .eq('id', tx_id);

      const { error: missionError } = await supabase
        .from('missions')
        .update({ status: 'COMPLETED' })
        .eq('tx_id', tx_id);

      if (collectError || missionError) throw new Error("Database update failed during finalization");

      // ✨ REWARD: Atomic Hustle Score Bump
      await supabase.rpc('increment', { row_id: runner_id, val: 25 });

      return NextResponse.json({ 
        success: true, 
        message: "Handshake Finalized. Reward Dispatched.",
        status: 'COLLECTED'
      });

    } 
    
    // 📸 SCENARIO B: Open Grid Drop (Photo Proof)
    else if (verification_mode === 'PHOTO') {
      if (!photo_url) return NextResponse.json({ error: "Photo evidence required for drop-off." }, { status: 400 });

      const { error: dropError } = await supabase
        .from('transactions')
        .update({ 
          status: 'DROPPED', 
          proof_image: photo_url 
        })
        .eq('id', tx_id);

      if (dropError) throw new Error("Drop-off update failed");

      return NextResponse.json({ 
        success: true, 
        message: "Drop-zone updated. Awaiting Buyer pickup.",
        status: 'DROPPED'
      });
    }

    return NextResponse.json({ error: "Invalid verification mode" }, { status: 400 });

  } catch (error) {
    console.error('Handshake error:', error);
    return NextResponse.json({ error: "System Error during handshake process" }, { status: 500 });
  }
}
