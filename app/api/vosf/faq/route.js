import { NextResponse } from 'next/server';
import { listFAQ, getConnection } from '../../../lib/database';
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

    // Get FAQs using new schema
    const faqs = await listFAQ({ search: search || undefined });

    // Get FAQ statistics
    const db = await getConnection();
    const totalCount = await db.execute('SELECT COUNT(*) as c FROM faq');

    const faqData = {
      faqs: faqs || [],
      statistics: {
        total: Number(totalCount.rows[0]?.c || 0)
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
