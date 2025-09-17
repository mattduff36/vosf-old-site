import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - List all venues with admin details
export async function GET(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const hasCoords = searchParams.get('hasCoords') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, name, description, lat, lon
      FROM poi
    `;
    
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (hasCoords !== '') {
      if (hasCoords === '1') {
        conditions.push('lat IS NOT NULL AND lon IS NOT NULL');
      } else if (hasCoords === '0') {
        conditions.push('(lat IS NULL OR lon IS NULL)');
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['name', 'description', 'lat', 'lon'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const client = await getConnection();
    const result = await client.execute({ sql: query, args: params });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM poi';
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Remove limit and offset params for count
      for (let i = 0; i < params.length - 2; i++) {
        countParams.push(params[i]);
      }
    }

    const countResult = await client.execute({ sql: countQuery, args: countParams });
    const totalCount = countResult.rows[0].count;

    return NextResponse.json({
      venues: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Admin venues API error:', error);
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
  }
}

// POST - Create new venue
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description = '', lat = null, lon = null } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate coordinates if provided
    if (lat !== null && (isNaN(parseFloat(lat)) || parseFloat(lat) < -90 || parseFloat(lat) > 90)) {
      return NextResponse.json({ error: 'Invalid latitude. Must be between -90 and 90' }, { status: 400 });
    }

    if (lon !== null && (isNaN(parseFloat(lon)) || parseFloat(lon) < -180 || parseFloat(lon) > 180)) {
      return NextResponse.json({ error: 'Invalid longitude. Must be between -180 and 180' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if venue name already exists
    const existingVenue = await client.execute({
      sql: 'SELECT id FROM poi WHERE name = ?',
      args: [name]
    });

    if (existingVenue.rows.length > 0) {
      return NextResponse.json({ error: 'Venue with this name already exists' }, { status: 409 });
    }

    // Insert new venue
    const result = await client.execute({
      sql: `
        INSERT INTO poi (name, description, lat, lon)
        VALUES (?, ?, ?, ?)
      `,
      args: [name, description, lat, lon]
    });

    // Get the created venue
    const newVenue = await client.execute({
      sql: 'SELECT * FROM poi WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    return NextResponse.json({ 
      message: 'Venue created successfully',
      venue: newVenue.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create venue error:', error);
    return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 });
  }
}
