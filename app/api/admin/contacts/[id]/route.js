import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get individual contact
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
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact: result.rows[0] });
  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

// PUT - Update contact
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

    // Check if contact exists
    const existingContact = await client.execute({
      sql: 'SELECT id FROM contacts WHERE id = ?',
      args: [id]
    });

    if (existingContact.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Validate required fields
    const { name, email, phone = '', message = '' } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already exists for different contact
    const emailCheck = await client.execute({
      sql: 'SELECT id FROM contacts WHERE email = ? AND id != ?',
      args: [email, id]
    });

    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Contact with this email already exists' }, { status: 409 });
    }

    // Update contact
    await client.execute({
      sql: `
        UPDATE contacts 
        SET name = ?, email = ?, phone = ?, message = ?
        WHERE id = ?
      `,
      args: [name, email, phone, message, id]
    });

    // Get updated contact
    const updatedContact = await client.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'Contact updated successfully',
      contact: updatedContact.rows[0]
    });

  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE - Delete contact
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();

    // Check if contact exists
    const existingContact = await client.execute({
      sql: 'SELECT id FROM contacts WHERE id = ?',
      args: [id]
    });

    if (existingContact.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete contact
    await client.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
