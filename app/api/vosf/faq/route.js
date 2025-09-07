import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/database';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');

    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get FAQs with optional search
    let query = `
      SELECT 
        id,
        username,
        phone
      FROM faq_signuser
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ` AND (username LIKE ? OR phone LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY username`;

    const faqs = await executeQuery(query, params);

    // Get FAQ statistics
    const totalCount = await executeQuery('SELECT COUNT(*) as count FROM faq_signuser');

    const faqData = {
      faqs: faqs || [],
      statistics: {
        total: totalCount[0]?.count || 0
      }
    };

    return NextResponse.json(faqData);
  } catch (error) {
    console.error('FAQ API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ data' },
      { status: 500 }
    );
  }
}
