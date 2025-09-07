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

    // Get comprehensive analytics data
    const [
      userStats,
      connectionStats,
      venueStats,
      faqStats,
      topConnectedStudios,
      usersByStatus,
      connectionsByStatus,
      recentActivity
    ] = await Promise.all([
      // User statistics
      executeQuery(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 0 THEN 1 END) as pending_users,
          MIN(joined) as first_user_date,
          MAX(joined) as latest_user_date
        FROM shows_users
      `),
      
      // Connection statistics
      executeQuery(`
        SELECT 
          COUNT(*) as total_connections,
          COUNT(CASE WHEN accepted = 1 THEN 1 END) as active_connections,
          COUNT(CASE WHEN accepted = 0 THEN 1 END) as pending_connections
        FROM shows_contacts
      `),
      
      // Venue statistics
      executeQuery(`
        SELECT 
          COUNT(*) as total_venues,
          COUNT(CASE WHEN lat IS NOT NULL AND lat != '' THEN 1 END) as venues_with_coords
        FROM poi_example
      `),
      
      // FAQ statistics
      executeQuery(`
        SELECT 
          COUNT(*) as total_faqs,
          COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as answered_faqs
        FROM faq_signuser
      `),
      
      // Top connected studios
      executeQuery(`
        SELECT 
          u.username,
          u.display_name,
          u.status,
          COUNT(c.id) as connection_count
        FROM shows_users u
        LEFT JOIN shows_contacts c ON (u.id = c.user1 OR u.id = c.user2)
        WHERE c.accepted = 1
        GROUP BY u.id, u.username, u.display_name, u.status
        HAVING connection_count > 0
        ORDER BY connection_count DESC
        LIMIT 10
      `),
      
      // Users by status distribution
      executeQuery(`
        SELECT 
          status,
          COUNT(*) as count
        FROM shows_users
        GROUP BY status
        ORDER BY status
      `),
      
      // Connections by status
      executeQuery(`
        SELECT 
          accepted,
          COUNT(*) as count
        FROM shows_contacts
        GROUP BY accepted
        ORDER BY accepted
      `),
      
      // Recent activity (latest users and connections)
      executeQuery(`
        SELECT 
          'user' as type,
          username as name,
          joined as date,
          status
        FROM shows_users
        WHERE joined IS NOT NULL
        ORDER BY joined DESC
        LIMIT 10
      `)
    ]);

    const analyticsData = {
      overview: {
        users: userStats[0] || {},
        connections: connectionStats[0] || {},
        venues: venueStats[0] || {},
        faqs: faqStats[0] || {}
      },
      topStudios: topConnectedStudios || [],
      distributions: {
        usersByStatus: usersByStatus || [],
        connectionsByStatus: connectionsByStatus || []
      },
      recentActivity: recentActivity || []
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
