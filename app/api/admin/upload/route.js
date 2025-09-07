import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadImageFromBuffer } from '../../../lib/cloudinary.js';

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
    const file = formData.get('file');
    const type = formData.get('type') || 'general'; // 'avatar', 'venue', 'general'
    const name = formData.get('name') || 'unnamed';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
