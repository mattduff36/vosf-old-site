import { NextResponse } from 'next/server';
import { getColumnAnalysis } from '../../../lib/database';
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
    const column = searchParams.get('column');
    
    if (!table || !column) {
      return NextResponse.json(
        { error: 'Table and column names are required' },
        { status: 400 }
      );
    }
    
    const analysis = await getColumnAnalysis(table, column);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Column analysis failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}



