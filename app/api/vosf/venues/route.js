import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/database';
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

    // Get venues with optional search
    let query = `
      SELECT 
        id,
        name,
        desc,
        lat,
        lon
      FROM poi_example
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR desc LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY name`;

    const venues = await executeQuery(query, params);

    // Get venue statistics
    const [totalCount, avgLat, avgLon] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM poi_example'),
      executeQuery('SELECT AVG(CAST(lat AS REAL)) as avg_lat FROM poi_example WHERE lat IS NOT NULL AND lat != ""'),
      executeQuery('SELECT AVG(CAST(lon AS REAL)) as avg_lon FROM poi_example WHERE lon IS NOT NULL AND lon != ""')
    ]);

    const venueData = {
      venues: venues || [],
      statistics: {
        total: totalCount[0]?.count || 0,
        center: {
          lat: avgLat[0]?.avg_lat || 51.5074, // Default to London
          lon: avgLon[0]?.avg_lon || -0.1278
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
