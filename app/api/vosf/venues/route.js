import { NextResponse } from 'next/server';
import { listVenues, getConnection } from '../../../lib/database';
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

    // Get venues using new schema
    const venues = await listVenues({ search: search || undefined });

    // Get venue statistics
    const db = await getConnection();
    const [totalCount, avgCoords] = await Promise.all([
      db.execute('SELECT COUNT(*) as c FROM poi'),
      db.execute(`
        SELECT 
          AVG(CAST(lat AS REAL)) as avg_lat, 
          AVG(CAST(lon AS REAL)) as avg_lon 
        FROM poi 
        WHERE lat IS NOT NULL AND lon IS NOT NULL
      `)
    ]);

    // Format venues for compatibility (desc -> description)
    const formattedVenues = venues.map(venue => ({
      ...venue,
      desc: venue.description // Map description to desc for frontend compatibility
    }));

    const venueData = {
      venues: formattedVenues,
      statistics: {
        total: Number(totalCount.rows[0]?.c || 0),
        center: {
          lat: avgCoords.rows[0]?.avg_lat || 51.5074, // Default to London
          lon: avgCoords.rows[0]?.avg_lon || -0.1278
        }
      }
    };

    return NextResponse.json(venueData);
  } catch (error) {
    console.error('Venues API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues data' },
      { status: 500 }
    );
  }
}
