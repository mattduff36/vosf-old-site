import { NextResponse } from 'next/server';
import { searchTables } from '../../../lib/database';
import { isAuthenticated } from '../../../lib/jwt';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check authentication using JWT
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const includeData = searchParams.get('includeData') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }
    
    const results = await searchTables(term, { includeData, limit });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}



