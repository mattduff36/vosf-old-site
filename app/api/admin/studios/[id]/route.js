import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get single studio by ID
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();
    
    const result = await client.execute({
      sql: `
        SELECT 
          id, username, display_name, email, status, joined, 
          avatar_url
        FROM shows_users 
        WHERE id = ?
      `,
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    return NextResponse.json({ studio: result.rows[0] });

  } catch (error) {
    console.error('Get studio error:', error);
    return NextResponse.json({ error: 'Failed to fetch studio' }, { status: 500 });
  }
}

// PUT - Update studio
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { username, display_name, email, status, avatar_url } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    const client = await getConnection();
    
    // Check if studio exists
    const existingStudio = await client.execute({
      sql: 'SELECT id FROM shows_users WHERE id = ?',
      args: [id]
    });

    if (existingStudio.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Check if username or email is taken by another studio
    const duplicateCheck = await client.execute({
      sql: 'SELECT id FROM shows_users WHERE (username = ? OR email = ?) AND id != ?',
      args: [username, email, id]
    });

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    // Update studio
    await client.execute({
      sql: `
        UPDATE shows_users 
        SET username = ?, display_name = ?, email = ?, status = ?, avatar_url = ?
        WHERE id = ?
      `,
      args: [username, display_name || username, email, status, avatar_url, id]
    });

    // Get updated studio
    const updatedStudio = await client.execute({
      sql: 'SELECT * FROM shows_users WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'Studio updated successfully',
      studio: updatedStudio.rows[0]
    });

  } catch (error) {
    console.error('Update studio error:', error);
    return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });
  }
}

// DELETE - Delete studio
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();
    
    // Check if studio exists
    const existingStudio = await client.execute({
      sql: 'SELECT id, username FROM shows_users WHERE id = ?',
      args: [id]
    });

    if (existingStudio.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const username = existingStudio.rows[0].username;

    // Delete studio (this will cascade to related records if foreign keys are set up)
    await client.execute({
      sql: 'DELETE FROM shows_users WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: `Studio '${username}' deleted successfully`
    });

  } catch (error) {
    console.error('Delete studio error:', error);
    return NextResponse.json({ error: 'Failed to delete studio' }, { status: 500 });
  }
}
