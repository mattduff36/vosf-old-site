import { NextResponse } from 'next/server';
import { searchTables } from '../../../lib/database';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
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



