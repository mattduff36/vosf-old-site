import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStudioById, updateStudio, deleteStudio, getConnection } from '../../../../lib/database.js';

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
    const prisma = await getConnection();
    
    // Get studio with owner and profile data using Prisma
    const studio = await prisma.studio.findUnique({
      where: { id: id },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // Transform to match expected format for the frontend
    const studioData = {
      id: studio.id,
      username: studio.owner?.username,
      display_name: studio.owner?.displayName,
      email: studio.owner?.email,
      status: studio.status?.toLowerCase(),
      joined: studio.createdAt,
      first_name: studio.owner?.profile?.firstName,
      last_name: studio.owner?.profile?.lastName,
      location: studio.owner?.profile?.location,
      address: studio.address,
      phone: studio.phone,
      url: studio.websiteUrl,
      instagram: studio.owner?.profile?.instagramUrl,
      youtubepage: studio.owner?.profile?.youtubeUrl,
      about: studio.owner?.profile?.about,
      latitude: studio.latitude ? parseFloat(studio.latitude.toString()) : null,
      longitude: studio.longitude ? parseFloat(studio.longitude.toString()) : null,
      shortabout: studio.owner?.profile?.shortAbout,
      category: '', // Not in new schema
      facebook: studio.owner?.profile?.facebookUrl,
      twitter: studio.owner?.profile?.twitterUrl,
      linkedin: studio.owner?.profile?.linkedinUrl,
      soundcloud: studio.owner?.profile?.soundcloudUrl,
      vimeo: studio.owner?.profile?.vimeoUrl,
      verified: studio.isVerified,
      featured: studio.owner?.profile?.isFeatured,
      avatar_image: studio.owner?.avatarUrl
    };
    
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
        verified: studioData.verified ? '1' : '0',
        featured: studioData.featured ? '1' : '0',
        avatar_image: studioData.avatar_image
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
