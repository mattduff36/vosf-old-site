import { NextResponse } from 'next/server';
import { executeSelectQuery } from '../../../lib/database';
import { cookies } from 'next/headers';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function POST(request) {
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
    
    const { query } = await request.json();
    
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const result = await executeSelectQuery(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Query execution failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
