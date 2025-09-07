import { NextResponse } from 'next/server';
import { getTableSchema } from '../../../lib/database.js';
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
    const tableName = searchParams.get('table');
    
    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }
    
    const schema = await getTableSchema(tableName);
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Schema API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve table schema',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

