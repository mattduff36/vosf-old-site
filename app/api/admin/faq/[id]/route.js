import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - Get individual FAQ entry
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
      sql: 'SELECT * FROM faq WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 });
    }

    return NextResponse.json({ faq: result.rows[0] });
  } catch (error) {
    console.error('Get FAQ error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQ entry' }, { status: 500 });
  }
}

// PUT - Update FAQ entry
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

    // Check if FAQ entry exists
    const existingFAQ = await client.execute({
      sql: 'SELECT id FROM faq WHERE id = ?',
      args: [id]
    });

    if (existingFAQ.rows.length === 0) {
      return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 });
    }

    // Validate required fields
    const { question, answer, sort_order = 0 } = body;
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Validate sort_order
    if (isNaN(parseInt(sort_order))) {
      return NextResponse.json({ error: 'Sort order must be a number' }, { status: 400 });
    }

    // Check if question already exists for different FAQ entry
    const questionCheck = await client.execute({
      sql: 'SELECT id FROM faq WHERE question = ? AND id != ?',
      args: [question, id]
    });

    if (questionCheck.rows.length > 0) {
      return NextResponse.json({ error: 'FAQ with this question already exists' }, { status: 409 });
    }

    // Update FAQ entry
    await client.execute({
      sql: `
        UPDATE faq 
        SET question = ?, answer = ?, sort_order = ?
        WHERE id = ?
      `,
      args: [question, answer, parseInt(sort_order), id]
    });

    // Get updated FAQ entry
    const updatedFAQ = await client.execute({
      sql: 'SELECT * FROM faq WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'FAQ entry updated successfully',
      faq: updatedFAQ.rows[0]
    });

  } catch (error) {
    console.error('Update FAQ error:', error);
    return NextResponse.json({ error: 'Failed to update FAQ entry' }, { status: 500 });
  }
}

// DELETE - Delete FAQ entry
export async function DELETE(request, { params }) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const client = await getConnection();

    // Check if FAQ entry exists
    const existingFAQ = await client.execute({
      sql: 'SELECT id FROM faq WHERE id = ?',
      args: [id]
    });

    if (existingFAQ.rows.length === 0) {
      return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 });
    }

    // Delete FAQ entry
    await client.execute({
      sql: 'DELETE FROM faq WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ 
      message: 'FAQ entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ entry' }, { status: 500 });
  }
}
