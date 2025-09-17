import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get individual venue
export async function GET(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();

    const result = await client.execute({
      sql: 'SELECT * FROM poi WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    return NextResponse.json({ venue: result.rows[0] });
  } catch (error) {
    console.error('Get venue error:', error);
    return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
  }
}

// PUT - Update venue
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

    // Check if venue exists
    const existingVenue = await client.execute({
      sql: 'SELECT id FROM poi WHERE id = ?',
      args: [id]
    });

    if (existingVenue.rows.length === 0) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Validate required fields
    const { name, description = '', lat = null, lon = null } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate coordinates if provided
    if (lat !== null && (isNaN(parseFloat(lat)) || parseFloat(lat) < -90 || parseFloat(lat) > 90)) {
      return NextResponse.json({ error: 'Invalid latitude. Must be between -90 and 90' }, { status: 400 });
    }

    if (lon !== null && (isNaN(parseFloat(lon)) || parseFloat(lon) < -180 || parseFloat(lon) > 180)) {
      return NextResponse.json({ error: 'Invalid longitude. Must be between -180 and 180' }, { status: 400 });
    }

    // Check if name already exists for different venue
    const nameCheck = await client.execute({
      sql: 'SELECT id FROM poi WHERE name = ? AND id != ?',
      args: [name, id]
    });

    if (nameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Venue with this name already exists' }, { status: 409 });
    }

    // Update venue
    await client.execute({
      sql: `
        UPDATE poi 
        SET name = ?, description = ?, lat = ?, lon = ?
        WHERE id = ?
      `,
      args: [name, description, lat, lon, id]
    });

    // Get updated venue
    const updatedVenue = await client.execute({
      sql: 'SELECT * FROM poi WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'Venue updated successfully',
      venue: updatedVenue.rows[0]
    });

  } catch (error) {
    console.error('Update venue error:', error);
    return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
  }
}

// DELETE - Delete venue
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();

    // Check if venue exists
    const existingVenue = await client.execute({
      sql: 'SELECT id FROM poi WHERE id = ?',
      args: [id]
    });

    if (existingVenue.rows.length === 0) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Delete venue
    await client.execute({
      sql: 'DELETE FROM poi WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'Venue deleted successfully'
    });

  } catch (error) {
    console.error('Delete venue error:', error);
    return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 });
  }
}
