import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: positions, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .order('opened_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(positions || []);
  } catch (error: any) {
    console.error('[API /positions] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
