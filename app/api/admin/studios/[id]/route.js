import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get single studio by ID with full profile data
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();
    
    // Get basic user data
    const userResult = await client.execute({
      sql: `
        SELECT 
          id, username, display_name, email, status, joined, 
          role_id, avatar_url
        FROM shows_users 
        WHERE id = ?
      `,
      args: [id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Get all metadata
    const metaResult = await client.execute({
      sql: 'SELECT meta_key, meta_value FROM shows_usermeta WHERE user_id = ?',
      args: [id]
    });

    // Convert metadata to object
    const meta = {};
    if (metaResult.rows) {
      metaResult.rows.forEach(row => {
        meta[row.meta_key] = row.meta_value;
      });
    }

    const profile = {
      ...userResult.rows[0],
      _meta: meta
    };

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Get studio error:', error);
    return NextResponse.json({ error: 'Failed to fetch studio' }, { status: 500 });
  }
}

// PUT - Update studio with comprehensive profile data
export async function PUT(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const client = await getConnection();

    // Check if studio exists
    const existingStudio = await client.execute({
      sql: 'SELECT id FROM shows_users WHERE id = ?',
      args: [id]
    });

    if (existingStudio.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Update basic user fields
    const userFields = ['username', 'display_name', 'email', 'status', 'avatar_url'];
    const userUpdates = [];
    const userArgs = [];

    userFields.forEach(field => {
      if (body[field] !== undefined) {
        userUpdates.push(`${field} = ?`);
        userArgs.push(body[field]);
      }
    });

    if (userUpdates.length > 0) {
      userArgs.push(id);
      await client.execute({
        sql: `UPDATE shows_users SET ${userUpdates.join(', ')} WHERE id = ?`,
        args: userArgs
      });
    }

    // Update metadata fields
    if (body.meta && typeof body.meta === 'object') {
      for (const [key, value] of Object.entries(body.meta)) {
        // Check if meta key already exists
        const existingMeta = await client.execute({
          sql: 'SELECT id FROM shows_usermeta WHERE user_id = ? AND meta_key = ?',
          args: [id, key]
        });

        if (existingMeta.rows && existingMeta.rows.length > 0) {
          // Update existing meta
          await client.execute({
            sql: 'UPDATE shows_usermeta SET meta_value = ? WHERE user_id = ? AND meta_key = ?',
            args: [value || '', id, key]
          });
        } else {
          // Insert new meta
          await client.execute({
            sql: 'INSERT INTO shows_usermeta (user_id, meta_key, meta_value) VALUES (?, ?, ?)',
            args: [id, key, value || '']
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Studio profile updated successfully'
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
