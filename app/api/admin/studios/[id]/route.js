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

    const studioData = studioResult.rows[0];
    
    // Structure the data to match what the frontend expects
    const profile = {
      // Basic user fields (not in _meta)
      id: studioData.id,
      username: studioData.username,
      display_name: studioData.display_name,
      email: studioData.email,
      status: studioData.status,
      joined: studioData.joined,
      
      // All profile fields go in _meta for frontend compatibility
      _meta: {
        first_name: studioData.first_name,
        last_name: studioData.last_name,
        location: studioData.location,
        address: studioData.address,
        phone: studioData.phone,
        url: studioData.url,
        instagram: studioData.instagram,
        youtubepage: studioData.youtubepage,
        about: studioData.about,
        latitude: studioData.latitude,
        longitude: studioData.longitude,
        shortabout: studioData.shortabout,
        category: studioData.category,
        facebook: studioData.facebook,
        twitter: studioData.twitter,
        linkedin: studioData.linkedin,
        soundcloud: studioData.soundcloud,
        vimeo: studioData.vimeo,
        pinterest: studioData.pinterest,
        tiktok: studioData.tiktok,
        gender: studioData.gender,
        birthday: studioData.birthday,
        rates1: studioData.rates1,
        rates2: studioData.rates2,
        rates3: studioData.rates3,
        showrates: studioData.showrates ? '1' : '0',
        homestudio: studioData.homestudio,
        homestudio2: studioData.homestudio2,
        homestudio3: studioData.homestudio3,
        homestudio4: studioData.homestudio4,
        homestudio5: studioData.homestudio5,
        homestudio6: studioData.homestudio6,
        avatar_image: studioData.avatar_image,
        avatar_type: studioData.avatar_type,
        youtube2: studioData.youtube2,
        vimeo2: studioData.vimeo2,
        soundcloudlink2: studioData.soundcloudlink2,
        soundcloudlink3: studioData.soundcloudlink3,
        soundcloudlink4: studioData.soundcloudlink4,
        verified: studioData.verified ? '1' : '0',
        featured: studioData.featured ? '1' : '0',
        featureddate: studioData.featureddate,
        crb: studioData.crb ? '1' : '0',
        von: studioData.von ? '1' : '0',
        lastupdated: studioData.lastupdated,
        locale: studioData.locale,
        last_login: studioData.last_login,
        last_login_ip: studioData.last_login_ip,
        showphone: studioData.showphone ? '1' : '0',
        showemail: studioData.showemail ? '1' : '0',
        showaddress: studioData.showaddress ? '1' : '0',
        showmap: studioData.showmap ? '1' : '0',
        showdirections: studioData.showdirections ? '1' : '0',
        showshort: studioData.showshort ? '1' : '0',
        facebookshow: studioData.facebookshow ? '1' : '0',
        twittershow: studioData.twittershow ? '1' : '0',
        instagramshow: studioData.instagramshow ? '1' : '0',
        linkedinshow: studioData.linkedinshow ? '1' : '0',
        youtubepageshow: studioData.youtubepageshow ? '1' : '0',
        soundcloudshow: studioData.soundcloudshow ? '1' : '0',
        vimeopageshow: studioData.vimeopageshow ? '1' : '0',
        pinterestshow: studioData.pinterestshow ? '1' : '0',
        connection1: studioData.connection1 ? '1' : '0',
        connection2: studioData.connection2 ? '1' : '0',
        connection3: studioData.connection3 ? '1' : '0',
        connection4: studioData.connection4 ? '1' : '0',
        connection5: studioData.connection5 ? '1' : '0',
        connection6: studioData.connection6 ? '1' : '0',
        connection7: studioData.connection7 ? '1' : '0',
        connection8: studioData.connection8 ? '1' : '0',
        connection9: studioData.connection9 ? '1' : '0',
        connection10: studioData.connection10 ? '1' : '0',
        connection11: studioData.connection11 ? '1' : '0',
        connection12: studioData.connection12 ? '1' : '0',
        connection13: studioData.connection13 ? '1' : '0',
        connection14: studioData.connection14 ? '1' : '0',
        connection15: studioData.connection15 ? '1' : '0'
      }
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

    // Handle regular text fields from meta
    profileFields.forEach(field => {
      if (body.meta && body.meta[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        profileArgs.push(body.meta[field] || '');
      }
    });

    // Handle boolean fields from meta
    booleanFields.forEach(field => {
      if (body.meta && body.meta[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        // Convert '1'/'0' strings to actual booleans for database
        const value = body.meta[field] === '1' || body.meta[field] === true;
        profileArgs.push(value ? 1 : 0);
      }
    });

    // Handle connection fields from meta
    connectionFields.forEach(field => {
      if (body.meta && body.meta[field] !== undefined) {
        profileUpdates.push(`${field} = ?`);
        // Convert '1'/'0' strings to actual booleans for database
        const value = body.meta[field] === '1' || body.meta[field] === true;
        profileArgs.push(value ? 1 : 0);
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
