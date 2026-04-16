import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { mission_id, runner_id } = await req.json();

    if (!mission_id || !runner_id) {
      return NextResponse.json({ error: "Missing identity parameters" }, { status: 400 });
    }

    // 1. CAPACITY CHECK: Max 3 Active Missions
    // In progress statuses: ACCEPTED, IN_TRANSIT
    const { count, error: countError } = await supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('runner_id', runner_id)
      .in('status', ['ACCEPTED', 'IN_TRANSIT', 'TAKEN']);

    if (countError) throw new Error("Could not verify runner capacity");

    if (count !== null && count >= 3) {
      return NextResponse.json({ 
        error: "Capacity Maxed. Complete your current missions to unlock new hustles." 
      }, { status: 400 });
    }

    // 2. ATOMIC CLAIM: Only claim if status is 'AVAILABLE'
    const { data, error: updateError } = await supabase
      .from('missions')
      .update({ 
        runner_id: runner_id, 
        status: 'ACCEPTED', // Or 'TAKEN' based on earlier master schema
        accepted_at: new Date().toISOString()
      })
      .eq('id', mission_id)
      .eq('status', 'AVAILABLE')
      .select();

    if (updateError) throw new Error("System error during mission claim");

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: "Mission Secured by Another Runner. Stay sharp." 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: true, 
      mission: data[0],
      message: "Mission Synchronized. Destination uploaded."
    });

  } catch (error: any) {
    console.error('Claim Error:', error);
    return NextResponse.json({ error: error.message || "Internal Pulse Error" }, { status: 500 });
  }
}
