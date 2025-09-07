import { NextResponse } from 'next/server';
import { getDatabaseOverview } from '../../../lib/database.js';
import { isAuthenticated } from '../../../lib/jwt.js';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check JWT authentication
    if (!isAuthenticated()) {
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

