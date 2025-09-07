import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - List all studios with admin details
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
    const status = searchParams.get('status') || '';
    const joinedAfter = searchParams.get('joinedAfter') || '';
    const joinedBefore = searchParams.get('joinedBefore') || '';
    const hasAvatar = searchParams.get('hasAvatar') || '';
    const sortBy = searchParams.get('sortBy') || 'joined';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, username, display_name, email, status, joined, 
        avatar_url
      FROM shows_users
    `;
    
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(username LIKE ? OR display_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== '' && status !== 'all') {
      conditions.push('status = ?');
      params.push(parseInt(status, 10));
    }

    if (joinedAfter) {
      conditions.push('joined >= ?');
      params.push(joinedAfter);
    }

    if (joinedBefore) {
      conditions.push('joined <= ?');
      params.push(joinedBefore + ' 23:59:59');
    }

    if (hasAvatar) {
      if (hasAvatar === '1') {
        conditions.push('avatar_url IS NOT NULL AND avatar_url != ""');
      } else if (hasAvatar === '0') {
        conditions.push('(avatar_url IS NULL OR avatar_url = "")');
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['joined', 'username', 'display_name', 'email', 'status'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'joined';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const client = await getConnection();
    const result = await client.execute({ sql: query, args: params });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM shows_users';
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
      studios: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Admin studios API error:', error);
    return NextResponse.json({ error: 'Failed to fetch studios' }, { status: 500 });
  }
}

// POST - Create new studio
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, display_name, email, status = 1, avatar_url = null } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if username or email already exists
    const existingUser = await client.execute({
      sql: 'SELECT id FROM shows_users WHERE username = ? OR email = ?',
      args: [username, email]
    });

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    // Insert new studio
    const result = await client.execute({
      sql: `
        INSERT INTO shows_users (username, display_name, email, status, joined, avatar_url)
        VALUES (?, ?, ?, ?, datetime('now'), ?)
      `,
      args: [username, display_name || username, email, status, avatar_url]
    });

    // Get the created studio
    const newStudio = await client.execute({
      sql: 'SELECT * FROM shows_users WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    return NextResponse.json({ 
      message: 'Studio created successfully',
      studio: newStudio.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create studio error:', error);
    return NextResponse.json({ error: 'Failed to create studio' }, { status: 500 });
  }
}
