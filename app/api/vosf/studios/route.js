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
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build query with filters
    let query = `
      SELECT 
        id,
        username,
        display_name,
        email,
        status,
        joined
      FROM shows_users
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ` AND (username LIKE ? OR display_name LIKE ? OR email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status !== '') {
      query += ` AND status = ?`;
      params.push(parseInt(status));
    }

    query += ` ORDER BY joined DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const studios = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM shows_users WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ` AND (username LIKE ? OR display_name LIKE ? OR email LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (status !== '') {
      countQuery += ` AND status = ?`;
      countParams.push(parseInt(status));
    }

    const totalResult = await executeQuery(countQuery, countParams);
    const total = totalResult[0]?.total || 0;

    return NextResponse.json({
      studios: studios || [],
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
