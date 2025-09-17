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
      sql: 'SELECT id FROM users WHERE id = ? AND COALESCE(status,\'\') <> \'stub\'',
      args: [id]
    });

    if (existingStudio.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Update basic user fields
    const userFields = ['username', 'displayname', 'email', 'status'];
    const userUpdates = [];
    const userArgs = [];

    userFields.forEach(field => {
      let bodyField = field;
      if (field === 'displayname' && body['display_name'] !== undefined) {
        bodyField = 'display_name';
      }
      
      if (body[bodyField] !== undefined) {
        userUpdates.push(`${field} = ?`);
        userArgs.push(body[bodyField]);
      }
    });

    if (userUpdates.length > 0) {
      userArgs.push(id);
      await client.execute({
        sql: `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        args: userArgs
      });
    }

    // Update profile fields - comprehensive list
    const profileFields = [
      'first_name', 'last_name', 'location', 'address', 'phone', 'url', 'instagram', 
      'youtubepage', 'about', 'latitude', 'longitude', 'shortabout', 'category',
      'facebook', 'twitter', 'linkedin', 'soundcloud', 'vimeo', 'pinterest', 'tiktok',
      'gender', 'birthday', 'rates1', 'rates2', 'rates3', 'homestudio', 'homestudio2',
      'homestudio3', 'homestudio4', 'homestudio5', 'homestudio6', 'avatar_image',
      'avatar_type', 'youtube2', 'vimeo2', 'soundcloudlink2', 'soundcloudlink3',
      'soundcloudlink4', 'featureddate', 'lastupdated', 'locale', 'last_login', 'last_login_ip'
    ];
    
    const booleanFields = [
      'showrates', 'showphone', 'showemail', 'showaddress', 'showmap', 'showdirections',
      'showshort', 'facebookshow', 'twittershow', 'instagramshow', 'linkedinshow',
      'youtubepageshow', 'soundcloudshow', 'vimeopageshow', 'pinterestshow',
      'verified', 'featured', 'crb', 'von'
    ];
    
    const connectionFields = [];
    for (let i = 1; i <= 15; i++) {
      connectionFields.push(`connection${i}`);
    }

    const profileUpdates = [];
    const profileArgs = [];

    // Handle regular text fields
    profileFields.forEach(field => {
      if (body[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        profileArgs.push(body[field] || '');
      }
    });

    // Handle boolean fields
    booleanFields.forEach(field => {
      if (body[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        profileArgs.push(body[field] ? 1 : 0);
      }
    });

    // Handle connection fields
    connectionFields.forEach(field => {
      if (body[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        profileArgs.push(body[field] ? 1 : 0);
      }
    });

    if (profileUpdates.length > 0) {
      profileArgs.push(id);
      await client.execute({
        sql: `UPDATE profile SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        args: profileArgs
      });
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
      sql: 'SELECT id, username FROM users WHERE id = ? AND COALESCE(status,\'\') <> \'stub\'',
      args: [id]
    });

    if (existingStudio.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const username = existingStudio.rows[0].username;

    // Delete profile first (due to foreign key constraint)
    await client.execute({
      sql: 'DELETE FROM profile WHERE user_id = ?',
      args: [id]
    });

    // Delete studio gallery images if table exists
    try {
      await client.execute({
        sql: 'DELETE FROM studio_gallery WHERE user_id = ?',
        args: [id]
      });
    } catch (error) {
      // Table might not exist, continue
      console.warn('Studio gallery table not found:', error.message);
    }

    // Delete the user
    await client.execute({
      sql: 'DELETE FROM users WHERE id = ?',
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
