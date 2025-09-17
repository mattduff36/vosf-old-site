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
        u.id, u.username, u.displayname as display_name, u.email, u.status, u.created_at as joined,
        p.first_name, p.last_name, p.location, p.phone, p.url, p.instagram, p.youtubepage
      FROM users u
      JOIN profile p ON p.user_id = u.id
    `;
    
    const params = [];
    const conditions = ['COALESCE(u.status,\'\') <> \'stub\''];

    if (search) {
      conditions.push('(u.username LIKE ? OR u.displayname LIKE ? OR u.email LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== '' && status !== 'all') {
      if (status === 'active') {
        conditions.push('COALESCE(u.status,\'\') <> \'stub\'');
      }
      // In new schema, all non-stub users are considered active
    }

    if (joinedAfter) {
      conditions.push('u.created_at >= ?');
      params.push(joinedAfter);
    }

    if (joinedBefore) {
      conditions.push('u.created_at <= ?');
      params.push(joinedBefore + ' 23:59:59');
    }

    if (hasAvatar) {
      // For now, we'll check if they have profile data as a proxy for having an avatar
      if (hasAvatar === '1') {
        conditions.push('(p.first_name IS NOT NULL AND p.first_name != "")');
      } else if (hasAvatar === '0') {
        conditions.push('(p.first_name IS NULL OR p.first_name = "")');
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'username', 'displayname', 'email', 'status', 'first_name', 'last_name'];
    let validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    // Map old column names to new ones
    if (sortBy === 'joined') validSortBy = 'u.created_at';
    else if (sortBy === 'display_name') validSortBy = 'u.displayname';
    else if (sortBy === 'username') validSortBy = 'u.username';
    else if (sortBy === 'email') validSortBy = 'u.email';
    else if (sortBy === 'status') validSortBy = 'u.status';
    else validSortBy = 'u.' + validSortBy;
    
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const client = await getConnection();
    const result = await client.execute({ sql: query, args: params });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users u JOIN profile p ON p.user_id = u.id';
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
    const { 
      username, 
      displayname, 
      email, 
      first_name = '', 
      last_name = '', 
      location = '', 
      phone = '', 
      url = '', 
      instagram = '', 
      youtubepage = '',
      about = ''
    } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if username or email already exists
    const existingUser = await client.execute({
      sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
      args: [username, email]
    });

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    // Insert new user
    const userResult = await client.execute({
      sql: `
        INSERT INTO users (username, displayname, email, status, created_at)
        VALUES (?, ?, ?, 'active', datetime('now'))
      `,
      args: [username, displayname || username, email]
    });

    const userId = userResult.lastInsertRowid;

    // Insert profile
    await client.execute({
      sql: `
        INSERT INTO profile (user_id, first_name, last_name, location, phone, url, instagram, youtubepage, about)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [userId, first_name, last_name, location, phone, url, instagram, youtubepage, about]
    });

    // Get the created studio with profile
    const newStudio = await client.execute({
      sql: `
        SELECT u.id, u.username, u.displayname as display_name, u.email, u.status, u.created_at as joined,
               p.first_name, p.last_name, p.location, p.phone, p.url, p.instagram, p.youtubepage, p.about
        FROM users u
        JOIN profile p ON p.user_id = u.id
        WHERE u.id = ?
      `,
      args: [userId]
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
