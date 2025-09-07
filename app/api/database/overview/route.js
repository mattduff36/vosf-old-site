import { NextResponse } from 'next/server';
import { getDatabaseOverview } from '../../../lib/database.js';
import { cookies } from 'next/headers';

export async function GET() {
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
    
    const overview = await getDatabaseOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve database overview',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

