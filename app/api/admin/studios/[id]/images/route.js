import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../../lib/database.js';

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

    // Get all images for this studio
    const imagesResult = await client.execute({
      sql: `
        SELECT 
          id, image_type, image_filename, cloudinary_url, 
          cloudinary_public_id, is_primary, display_order,
          created_at
        FROM studio_gallery 
        WHERE user_id = ?
        ORDER BY is_primary DESC, display_order ASC, created_at ASC
      `,
      args: [id]
    });

    return NextResponse.json({ 
      images: imagesResult.rows || []
    });
  } catch (error) {
    console.error('Images API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
