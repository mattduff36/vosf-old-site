import { NextResponse } from 'next/server';
import { getTableData } from '../../../lib/database';
import { cookies } from 'next/headers';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function GET(request) {
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
    
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!table) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }
    
    const result = await getTableData(table, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to browse table:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
