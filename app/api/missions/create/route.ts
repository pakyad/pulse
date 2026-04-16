import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      organization_id, 
      title, 
      type, 
      reward_hp, 
      reward_rm,
      pickup_location, 
      drop_location, 
      slots 
    } = body;

    // 1. ROLE VERIFICATION
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', organization_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Organization profile not found" }, { status: 404 });
    }

    if (profile.role === 'STUDENT') {
      return NextResponse.json({ 
        error: "Unauthorized Activity. Students are prohibited from creating missions." 
      }, { status: 403 });
    }

    // 2. BATCH DATA PREPARATION
    const missionCount = Math.min(Math.max(parseInt(slots) || 1, 1), 50); // Hard cap of 50 per batch
    
    const missionsToCreate = Array.from({ length: missionCount }).map(() => ({
      organization_id,
      title,
      type: type || 'OFFICIAL',
      reward_hp: reward_hp || 10,
      reward_rm: reward_rm || 0,
      pickup_location: pickup_location || 'N/A',
      drop_location: drop_location || 'N/A',
      status: 'AVAILABLE'
    }));

    // 3. ATOMIC DEPLOYMENT
    const { data, error: insertError } = await supabase
      .from('missions')
      .insert(missionsToCreate)
      .select();

    if (insertError) {
      console.error('Insert Error:', insertError);
      return NextResponse.json({ error: "Deployment failed at database level" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      message: `${data.length} mission slots deployed to the Pulse.`
    });

  } catch (error: any) {
    console.error('Creation Error:', error);
    return NextResponse.json({ error: "Internal System Malfunction" }, { status: 500 });
  }
}
