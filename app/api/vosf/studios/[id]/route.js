import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getStudioById, getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get studio profile using new schema
    const studioData = await getStudioById(id);

    if (!studioData) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }

    // Get additional data that might exist in legacy tables
    const client = await getConnection();
    
    // Check for studio gallery images (if table exists)
    let gallery = { avatar: null, images: [] };
    try {
      const galleryResult = await client.execute({
        sql: `
          SELECT image_type, image_filename, cloudinary_url, is_primary, display_order
          FROM studio_gallery 
          WHERE user_id = ?
          ORDER BY is_primary DESC, display_order ASC
        `,
        args: [id]
      });

      if (galleryResult.rows) {
        galleryResult.rows.forEach(row => {
          if (row.image_type === 'avatar' && row.is_primary) {
            gallery.avatar = {
              filename: row.image_filename,
              url: row.cloudinary_url,
              order: row.display_order
            };
          } else if (row.image_type === 'gallery') {
            gallery.images.push({
              filename: row.image_filename,
              url: row.cloudinary_url,
              order: row.display_order
            });
          }
        });
      }
    } catch (error) {
      // Studio gallery table might not exist, continue without it
      console.warn('Studio gallery table not found:', error.message);
    }

    // Build comprehensive profile using new schema data
    const profile = {
      // Basic user info
      id: studioData.id,
      username: studioData.username,
      display_name: studioData.displayname,
      email: studioData.email,
      status: studioData.status,
      joined: studioData.created_at,
      
      // Profile data from new schema
      first_name: studioData.first_name || '',
      last_name: studioData.last_name || '',
      about: studioData.about || '',
      location: studioData.location || '',
      address: studioData.address || '',
      phone: studioData.phone || '',
      url: studioData.url || '',
      latitude: studioData.latitude,
      longitude: studioData.longitude,
      
      // Social media (from profile table)
      social: {
        instagram: studioData.instagram || '',
        youtube: studioData.youtubepage || '',
        twitter: '',
        facebook: '',
        linkedin: '',
        soundcloud: '',
        vimeo: ''
      },
      
      // Legacy compatibility fields
      shortabout: '',
      category: '',
      media: {
        youtube: studioData.youtubepage || '',
        youtube2: '',
        vimeo: '',
        vimeo2: '',
        soundcloudlink: '',
        soundcloudlink2: '',
        soundcloudlink3: '',
        soundcloudlink4: ''
      },
      
      rates: {
        rate1: '',
        rate2: '',
        rate3: '',
        showrates: false
      },
      
      connections: {
        connection1: false,
        connection2: false,
        connection3: false,
        connection4: false,
        connection5: false,
        connection6: false,
        connection7: false,
        connection8: false
      },
      
      display: {
        twittershow: false,
        facebookshow: false,
        youtubepageshow: !!studioData.youtubepage,
        linkedinshow: false,
        instagramshow: !!studioData.instagram,
        soundcloudshow: false,
        vimeopageshow: false
      },
      
      gender: '',
      birthday: '',
      locale: 'en',
      last_login: null,
      last_login_ip: null,
      
      // Gallery images
      gallery: gallery
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Studio profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch studio profile' },
      { status: 500 }
    );
  }
}
