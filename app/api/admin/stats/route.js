import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

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

    const client = await getConnection();

    // Get comprehensive statistics
    const [
      totalStudios,
      activeStudios,
      studiosWithAvatars,
      recentJoins,
      statusBreakdown,
      joinTrends
    ] = await Promise.all([
      // Total studios
      client.execute('SELECT COUNT(*) as count FROM shows_users'),
      
      // Active studios
      client.execute('SELECT COUNT(*) as count FROM shows_users WHERE status = 1'),
      
      // Studios with avatars
      client.execute('SELECT COUNT(*) as count FROM shows_users WHERE avatar_url IS NOT NULL AND avatar_url != ""'),
      
      // Recent joins (last 30 days)
      client.execute(`
        SELECT COUNT(*) as count 
        FROM shows_users 
        WHERE joined >= datetime('now', '-30 days')
      `),
      
      // Status breakdown
      client.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM shows_users 
        GROUP BY status
      `),
      
      // Join trends (last 12 months)
      client.execute(`
        SELECT 
          strftime('%Y-%m', joined) as month,
          COUNT(*) as count
        FROM shows_users 
        WHERE joined >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', joined)
        ORDER BY month DESC
      `)
    ]);

    const stats = {
      totalStudios: totalStudios.rows[0]?.count || 0,
      activeStudios: activeStudios.rows[0]?.count || 0,
      studiosWithAvatars: studiosWithAvatars.rows[0]?.count || 0,
      recentJoins: recentJoins.rows[0]?.count || 0,
      statusBreakdown: statusBreakdown.rows || [],
      joinTrends: joinTrends.rows || []
    };

    // Calculate additional metrics
    stats.inactiveStudios = stats.totalStudios - stats.activeStudios;
    stats.avatarPercentage = stats.totalStudios > 0 
      ? Math.round((stats.studiosWithAvatars / stats.totalStudios) * 100) 
      : 0;
    stats.activePercentage = stats.totalStudios > 0 
      ? Math.round((stats.activeStudios / stats.totalStudios) * 100) 
      : 0;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
