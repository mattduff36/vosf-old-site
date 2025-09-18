import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminStats } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getAdminStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
