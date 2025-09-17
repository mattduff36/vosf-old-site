import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - List all contacts with admin details
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
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, name, email, phone, message, created_at
      FROM contacts
    `;
    
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR message LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'name', 'email'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const client = await getConnection();
    const result = await client.execute({ sql: query, args: params });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM contacts';
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
      contacts: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Admin contacts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST - Create new contact
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, phone = '', message = '' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if email already exists
    const existingContact = await client.execute({
      sql: 'SELECT id FROM contacts WHERE email = ?',
      args: [email]
    });

    if (existingContact.rows.length > 0) {
      return NextResponse.json({ error: 'Contact with this email already exists' }, { status: 409 });
    }

    // Insert new contact
    const result = await client.execute({
      sql: `
        INSERT INTO contacts (name, email, phone, message, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `,
      args: [name, email, phone, message]
    });

    // Get the created contact
    const newContact = await client.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    return NextResponse.json({ 
      message: 'Contact created successfully',
      contact: newContact.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
