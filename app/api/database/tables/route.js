import { NextResponse } from 'next/server';
import { getTables } from '../../../lib/database';
import { cookies } from 'next/headers';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check simple cookie authentication
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const tables = await getTables();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}
