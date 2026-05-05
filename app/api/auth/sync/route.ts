import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('User')
      .upsert({ 
        supabaseId: user.id, 
        email: user.email!, 
        name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
        role: "ADMIN" // Default for new synced users
      }, {
        onConflict: 'supabaseId'
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    
    return NextResponse.json({ message: 'Synced successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
