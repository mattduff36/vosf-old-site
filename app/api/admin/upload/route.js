import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadImageFromBuffer } from '../../../lib/cloudinary.js';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// POST - Upload image to Cloudinary
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') || formData.get('file');
    const studioId = formData.get('studioId');
    const type = formData.get('type') || 'gallery'; // 'avatar', 'gallery'
    const name = formData.get('name') || 'studio_image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate public ID based on type
    const timestamp = Date.now();
    const publicId = `${type}/${name}_${timestamp}`;

    // Upload to Cloudinary
    const result = await uploadImageFromBuffer(buffer, publicId, 'vosf');

    if (result.success) {
      // Add to studio gallery table
      const client = await getConnection();
      
      // Get next display order
      const orderResult = await client.execute({
        sql: 'SELECT MAX(display_order) as max_order FROM studio_gallery WHERE user_id = ?',
        args: [studioId]
      });
      
      const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;
      
      // Insert into gallery
      await client.execute({
        sql: `
          INSERT INTO studio_gallery 
          (user_id, image_type, image_filename, cloudinary_url, cloudinary_public_id, is_primary, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          studioId,
          type,
          file.name,
          result.url,
          result.publicId,
          type === 'avatar' ? 1 : 0,
          nextOrder
        ]
      });

      return NextResponse.json({
        message: 'Image uploaded successfully',
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to upload image: ' + result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
