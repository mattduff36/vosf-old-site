import { NextResponse } from 'next/server';
import { listStudios, getConnection } from '../../../lib/database';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');

    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const hasCoords = searchParams.get('hasCoords') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Use the new listStudios function with proper filtering
    const allStudios = await listStudios({ 
      q: search || undefined, 
      hasCoords: hasCoords || undefined 
    });

    // Apply pagination
    const total = allStudios.length;
    const studios = allStudios.slice(offset, offset + limit);

    // Add additional fields for compatibility
    const enhancedStudios = studios.map(studio => ({
      ...studio,
      display_name: studio.name,
      status: 'active', // All non-stub users are active in new schema
      joined: null // Will be populated from users table if needed
    }));

    return NextResponse.json({
      studios: enhancedStudios,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Studios API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studios data' },
      { status: 500 }
    );
  }
}
