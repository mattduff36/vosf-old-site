import { NextResponse } from 'next/server';
import { getConnection, analyticsSql, studiosCountSql } from '../../../lib/database';
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

    // Get comprehensive analytics data using new schema
    const db = await getConnection();
    const [
      studiosCount,
      connectionsCount,
      venuesTotal,
      venuesWithCoords,
      faqTotal,
      firstUser,
      latestUser,
      topConnectedStudios,
      recentActivity
    ] = await Promise.all([
      // Studios count (users with profiles, excluding stubs)
      db.execute(studiosCountSql),
      
      // Connection statistics
      db.execute(analyticsSql.connections),
      
      // Venue statistics
      db.execute(analyticsSql.venuesTotal),
      db.execute(analyticsSql.venuesWithCoords),
      
      // FAQ statistics
      db.execute(analyticsSql.faqTotal),
      
      // User timeline
      db.execute(analyticsSql.firstUser),
      db.execute(analyticsSql.latestUser),
      
      // Top connected studios (based on contacts table)
      db.execute(`
        SELECT 
          u.username,
          u.displayname,
          COALESCE(TRIM(p.first_name||' '||p.last_name), u.displayname, u.username) as display_name,
          COUNT(DISTINCT c.id) as connection_count
        FROM users u
        JOIN profile p ON p.user_id = u.id
        LEFT JOIN contacts c ON (c.name LIKE '%'||u.username||'%' OR c.email = u.email)
        WHERE COALESCE(u.status,'') <> 'stub'
        GROUP BY u.id, u.username, u.displayname, p.first_name, p.last_name
        HAVING connection_count > 0
        ORDER BY connection_count DESC
        LIMIT 10
      `),
      
      // Recent activity (latest users)
      db.execute(`
        SELECT 
          'user' as type,
          COALESCE(TRIM(p.first_name||' '||p.last_name), u.displayname, u.username) as name,
          u.created_at as date,
          u.status
        FROM users u
        JOIN profile p ON p.user_id = u.id
        WHERE u.created_at IS NOT NULL AND COALESCE(u.status,'') <> 'stub'
        ORDER BY u.created_at DESC
        LIMIT 10
      `)
    ]);

    const analyticsData = {
      overview: {
        users: {
          total_users: Number(studiosCount.rows[0]?.c || 0),
          active_users: Number(studiosCount.rows[0]?.c || 0), // All non-stub users are active
          pending_users: 0, // No pending concept in new schema
          first_user_date: firstUser.rows[0]?.d || null,
          latest_user_date: latestUser.rows[0]?.d || null
        },
        connections: {
          total_connections: Number(connectionsCount.rows[0]?.c || 0),
          active_connections: Number(connectionsCount.rows[0]?.c || 0), // All connections are active
          pending_connections: 0 // No pending concept in new schema
        },
        venues: {
          total_venues: Number(venuesTotal.rows[0]?.c || 0),
          venues_with_coords: Number(venuesWithCoords.rows[0]?.c || 0)
        },
        faqs: {
          total_faqs: Number(faqTotal.rows[0]?.c || 0),
          answered_faqs: Number(faqTotal.rows[0]?.c || 0) // All FAQs are considered answered
        }
      },
      topStudios: topConnectedStudios.rows || [],
      distributions: {
        usersByStatus: [
          { status: 'active', count: Number(studiosCount.rows[0]?.c || 0) }
        ],
        connectionsByStatus: [
          { accepted: 1, count: Number(connectionsCount.rows[0]?.c || 0) }
        ]
      },
      recentActivity: recentActivity.rows || []
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
