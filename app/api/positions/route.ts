import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('positions')
      .select('*');

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('opened_at', { ascending: false });

    const { data: positions, error } = await query;

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
