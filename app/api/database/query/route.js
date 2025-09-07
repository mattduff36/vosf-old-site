import { NextResponse } from 'next/server';
import { executeSelectQuery } from '../../../lib/database';
import { isAuthenticated } from '../../../lib/jwt';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Check JWT authentication
    if (!isAuthenticated()) {
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
