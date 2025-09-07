import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/database';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');

    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get dashboard statistics
    const [
      studioCount,
      connectionCount,
      venueCount,
      faqCount,
      activeStudios,
      recentConnections
    ] = await Promise.all([
      // Total studios
      executeQuery('SELECT COUNT(*) as count FROM shows_users'),
      
      // Total connections
      executeQuery('SELECT COUNT(*) as count FROM shows_contacts WHERE accepted = 1'),
      
      // Total venues
      executeQuery('SELECT COUNT(*) as count FROM poi_example'),
      
      // Total FAQs
      executeQuery('SELECT COUNT(*) as count FROM faq_signuser'),
      
      // Active studios (status = 1)
      executeQuery('SELECT COUNT(*) as count FROM shows_users WHERE status = 1'),
      
      // Recent connections (last 5)
      executeQuery(`
        SELECT 
          u1.username as studio1,
          u2.username as studio2,
          c.accepted,
          c.id
        FROM shows_contacts c
        JOIN shows_users u1 ON c.user1 = u1.id
        JOIN shows_users u2 ON c.user2 = u2.id
        WHERE c.accepted = 1
        ORDER BY c.id DESC
        LIMIT 5
      `)
    ]);

    const dashboardData = {
      studios: {
        total: studioCount[0]?.count || 0,
        active: activeStudios[0]?.count || 0
      },
      connections: {
        total: connectionCount[0]?.count || 0,
        recent: recentConnections || []
      },
      venues: {
        total: venueCount[0]?.count || 0
      },
      faqs: {
        total: faqCount[0]?.count || 0
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
