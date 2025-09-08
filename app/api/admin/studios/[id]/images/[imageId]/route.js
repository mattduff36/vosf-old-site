import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, imageId } = params;
    const client = await getConnection();

    // Delete the image record
    await client.execute({
      sql: 'DELETE FROM studio_gallery WHERE id = ? AND user_id = ?',
      args: [imageId, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, imageId } = params;
    const body = await request.json();
    const client = await getConnection();

    // Update image properties
    const updates = [];
    const args = [];

    if (body.is_primary !== undefined) {
      // If setting as primary, first unset all other primary images
      if (body.is_primary) {
        await client.execute({
          sql: 'UPDATE studio_gallery SET is_primary = 0 WHERE user_id = ?',
          args: [id]
        });
      }
      updates.push('is_primary = ?');
      args.push(body.is_primary ? 1 : 0);
    }

    if (body.display_order !== undefined) {
      updates.push('display_order = ?');
      args.push(body.display_order);
    }

    if (body.image_type !== undefined) {
      updates.push('image_type = ?');
      args.push(body.image_type);
    }

    if (updates.length > 0) {
      args.push(imageId, id);
      await client.execute({
        sql: `UPDATE studio_gallery SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        args: args
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update image API error:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
