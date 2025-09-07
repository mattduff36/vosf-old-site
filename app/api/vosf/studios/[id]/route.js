import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

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

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Studio not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get extended profile data from usermeta
    const metaResult = await client.execute({
      sql: `
        SELECT meta_key, meta_value 
        FROM shows_usermeta 
        WHERE user_id = ?
      `,
      args: [id]
    });

    // Convert usermeta to object
    const meta = {};
    if (metaResult.rows) {
      metaResult.rows.forEach(row => {
        meta[row.meta_key] = row.meta_value;
      });
    }

    // Build comprehensive profile
    const profile = {
      ...user,
      // Basic profile info
      first_name: meta.first_name || '',
      last_name: meta.last_name || '',
      about: meta.about || '',
      shortabout: meta.shortabout || '',
      category: meta.category || '',
      location: meta.location || '',
      phone: meta.phone || '',
      url: meta.url || '',
      
      // Social media
      social: {
        twitter: meta.twitter || '',
        facebook: meta.facebook || '',
        youtube: meta.youtubepage || '',
        linkedin: meta.linkedin || '',
        instagram: meta.instagram || '',
        soundcloud: meta.soundcloud || '',
        vimeo: meta.vimeopage || ''
      },
      
      // Media links
      media: {
        youtube: meta.youtube || '',
        youtube2: meta.youtube2 || '',
        vimeo: meta.vimeo || '',
        vimeo2: meta.vimeo2 || '',
        soundcloudlink: meta.soundcloudlink || '',
        soundcloudlink2: meta.soundcloudlink2 || '',
        soundcloudlink3: meta.soundcloudlink3 || '',
        soundcloudlink4: meta.soundcloudlink4 || ''
      },
      
      // Rates
      rates: {
        rate1: meta.rates1 || '',
        rate2: meta.rates2 || '',
        rate3: meta.rates3 || '',
        showrates: meta.showrates === '1'
      },
      
      // Connections
      connections: {
        connection1: meta.connection1 === '1',
        connection2: meta.connection2 === '1',
        connection3: meta.connection3 === '1',
        connection4: meta.connection4 === '1',
        connection5: meta.connection5 === '1',
        connection6: meta.connection6 === '1',
        connection7: meta.connection7 === '1',
        connection8: meta.connection8 === '1'
      },
      
      // Display preferences
      display: {
        twittershow: meta.twittershow === '1',
        facebookshow: meta.facebookshow === '1',
        youtubepageshow: meta.youtubepageshow === '1',
        linkedinshow: meta.linkedinshow === '1',
        instagramshow: meta.instagramshow === '1',
        soundcloudshow: meta.soundcloudshow === '1',
        vimeopageshow: meta.vimeopageshow === '1'
      },
      
      // Additional metadata
      gender: meta.gender || '',
      birthday: meta.birthday || '',
      locale: meta.locale || 'en',
      last_login: meta.last_login || null,
      last_login_ip: meta.last_login_ip || null,
      
      // Raw meta for debugging
      _meta: meta
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
