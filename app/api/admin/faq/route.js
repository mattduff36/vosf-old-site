import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - List all FAQ entries with admin details
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
    const sortBy = searchParams.get('sortBy') || 'sort_order';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, question, answer, sort_order
      FROM faq
    `;
    
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(question LIKE ? OR answer LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['sort_order', 'question', 'answer', 'id'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'sort_order';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
    
    // Add secondary sort by id for consistent ordering
    if (validSortBy !== 'id') {
      query += ', id ASC';
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const client = await getConnection();
    const result = await client.execute({ sql: query, args: params });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM faq';
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
      faqs: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Admin FAQ API error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ entries' }, { status: 500 });
  }
}

// POST - Create new FAQ entry
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { question, answer, sort_order = 0 } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Validate sort_order
    if (isNaN(parseInt(sort_order))) {
      return NextResponse.json({ error: 'Sort order must be a number' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if question already exists
    const existingFAQ = await client.execute({
      sql: 'SELECT id FROM faq WHERE question = ?',
      args: [question]
    });

    if (existingFAQ.rows.length > 0) {
      return NextResponse.json({ error: 'FAQ with this question already exists' }, { status: 409 });
    }

    // Insert new FAQ entry
    const result = await client.execute({
      sql: `
        INSERT INTO faq (question, answer, sort_order)
        VALUES (?, ?, ?)
      `,
      args: [question, answer, parseInt(sort_order)]
    });

    // Get the created FAQ entry
    const newFAQ = await client.execute({
      sql: 'SELECT * FROM faq WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    return NextResponse.json({ 
      message: 'FAQ entry created successfully',
      faq: newFAQ.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ error: 'Failed to create FAQ entry' }, { status: 500 });
  }
}
