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
    
    // Get comprehensive user and profile data from new schema
    const studioResult = await client.execute({
      sql: `
        SELECT 
          u.id, u.username, u.displayname as display_name, u.email, u.status, u.created_at as joined,
          p.first_name, p.last_name, p.location, p.address, p.phone, p.url, p.instagram, p.youtubepage, p.about,
          p.latitude, p.longitude, p.shortabout, p.category, p.facebook, p.twitter, p.linkedin, 
          p.soundcloud, p.vimeo, p.pinterest, p.tiktok, p.gender, p.birthday,
          p.rates1, p.rates2, p.rates3, p.showrates, p.homestudio, p.homestudio2, p.homestudio3,
          p.homestudio4, p.homestudio5, p.homestudio6, p.avatar_image, p.avatar_type,
          p.youtube2, p.vimeo2, p.soundcloudlink2, p.soundcloudlink3, p.soundcloudlink4,
          p.verified, p.featured, p.featureddate, p.crb, p.von, p.lastupdated, p.locale,
          p.last_login, p.last_login_ip, p.showphone, p.showemail, p.showaddress, p.showmap,
          p.showdirections, p.showshort, p.facebookshow, p.twittershow, p.instagramshow,
          p.linkedinshow, p.youtubepageshow, p.soundcloudshow, p.vimeopageshow, p.pinterestshow,
          p.connection1, p.connection2, p.connection3, p.connection4, p.connection5,
          p.connection6, p.connection7, p.connection8, p.connection9, p.connection10,
          p.connection11, p.connection12, p.connection13, p.connection14, p.connection15
        FROM users u
        JOIN profile p ON p.user_id = u.id
        WHERE u.id = ? AND COALESCE(u.status,'') <> 'stub'
      `,
      args: [id]
    });

    if (studioResult.rows.length === 0) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const profile = studioResult.rows[0];

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
