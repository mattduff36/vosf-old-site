import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listStudiosAdmin, createStudio } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

// GET - List all studios with admin details
export async function GET(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const joinedAfter = searchParams.get('joinedAfter') || '';
    const joinedBefore = searchParams.get('joinedBefore') || '';
    const hasAvatar = searchParams.get('hasAvatar') || '';
    const sortBy = searchParams.get('sortBy') || 'joined';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const result = await listStudiosAdmin({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Admin studios API error:', error);
    return NextResponse.json({ error: 'Failed to fetch studios' }, { status: 500 });
  }
}

// POST - Create new studio
export async function POST(request) {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      username, 
      displayname, 
      email, 
      first_name = '', 
      last_name = '', 
      location = '', 
      phone = '', 
      url = '', 
      instagram = '', 
      youtubepage = '',
      about = ''
    } = body;

    if (!username || !email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const studio = await createStudio({
      username,
      displayname,
      email,
      first_name,
      last_name,
      location,
      phone,
      url,
      instagram,
      youtubepage,
      about
    });

    return NextResponse.json({ 
      message: 'Studio created successfully',
      studio: studio
    }, { status: 201 });

  } catch (error) {
    console.error('Create studio error:', error);
    return NextResponse.json({ error: 'Failed to create studio' }, { status: 500 });
  }
}
