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

    // Get comprehensive statistics using new schema
    const [
      totalStudios,
      studiosWithProfiles,
      studiosWithAvatars,
      recentJoins,
      profileCompleteness,
      studiosWithRates
    ] = await Promise.all([
      // Total studios (users table)
      client.execute(`SELECT COUNT(*) as count FROM users WHERE COALESCE(status,'') <> 'stub'`),
      
      // Studios with profile data
      client.execute(`
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN profile p ON u.id = p.user_id 
        WHERE COALESCE(u.status,'') <> 'stub'
        AND (p.about IS NOT NULL AND p.about != '')
      `),
      
      // Studios with avatars
      client.execute(`
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN profile p ON u.id = p.user_id 
        WHERE COALESCE(u.status,'') <> 'stub'
        AND (p.avatar_image IS NOT NULL AND p.avatar_image != '')
      `),
      
      // Recent joins (last 30 days)
      client.execute(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE COALESCE(status,'') <> 'stub'
        AND joined >= datetime('now', '-30 days')
      `),
      
      // Profile completeness (studios with key fields filled)
      client.execute(`
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN profile p ON u.id = p.user_id 
        WHERE COALESCE(u.status,'') <> 'stub'
        AND p.about IS NOT NULL AND p.about != ''
        AND p.phone IS NOT NULL AND p.phone != ''
        AND p.email IS NOT NULL AND p.email != ''
      `),
      
      // Studios with rates information
      client.execute(`
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN profile p ON u.id = p.user_id 
        WHERE COALESCE(u.status,'') <> 'stub'
        AND (p.rates1 IS NOT NULL AND p.rates1 != '' 
             OR p.rates2 IS NOT NULL AND p.rates2 != ''
             OR p.rates3 IS NOT NULL AND p.rates3 != '')
      `)
    ]);

    const stats = {
      totalStudios: totalStudios.rows[0]?.count || 0,
      studiosWithProfiles: studiosWithProfiles.rows[0]?.count || 0,
      studiosWithAvatars: studiosWithAvatars.rows[0]?.count || 0,
      recentJoins: recentJoins.rows[0]?.count || 0,
      profileCompleteness: profileCompleteness.rows[0]?.count || 0,
      studiosWithRates: studiosWithRates.rows[0]?.count || 0
    };

    // Calculate additional metrics for admin dashboard
    stats.profilePercentage = stats.totalStudios > 0 
      ? Math.round((stats.studiosWithProfiles / stats.totalStudios) * 100) 
      : 0;
    stats.avatarPercentage = stats.totalStudios > 0 
      ? Math.round((stats.studiosWithAvatars / stats.totalStudios) * 100) 
      : 0;
    stats.completenessPercentage = stats.totalStudios > 0 
      ? Math.round((stats.profileCompleteness / stats.totalStudios) * 100) 
      : 0;
    stats.ratesPercentage = stats.totalStudios > 0 
      ? Math.round((stats.studiosWithRates / stats.totalStudios) * 100) 
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
