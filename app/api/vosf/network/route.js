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
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get network statistics
    const [
      totalConnections,
      activeConnections,
      pendingConnections,
      topConnectedStudios,
      recentConnections
    ] = await Promise.all([
      // Total connections
      executeQuery('SELECT COUNT(*) as count FROM shows_contacts'),
      
      // Active connections (accepted = 1)
      executeQuery('SELECT COUNT(*) as count FROM shows_contacts WHERE accepted = 1'),
      
      // Pending connections (accepted = 0)
      executeQuery('SELECT COUNT(*) as count FROM shows_contacts WHERE accepted = 0'),
      
      // Top connected studios
      executeQuery(`
        SELECT 
          u.username,
          u.display_name,
          u.email,
          COUNT(c.id) as connection_count
        FROM shows_users u
        LEFT JOIN shows_contacts c ON (u.id = c.user1 OR u.id = c.user2)
        WHERE c.accepted = 1
        GROUP BY u.id, u.username, u.display_name, u.email
        HAVING connection_count > 0
        ORDER BY connection_count DESC
        LIMIT 10
      `),
      
      // Recent connections with studio details
      executeQuery(`
        SELECT 
          c.id,
          c.accepted,
          c.user1,
          c.user2,
          u1.username as studio1_username,
          u1.display_name as studio1_name,
          u1.email as studio1_email,
          u2.username as studio2_username,
          u2.display_name as studio2_name,
          u2.email as studio2_email
        FROM shows_contacts c
        JOIN shows_users u1 ON c.user1 = u1.id
        JOIN shows_users u2 ON c.user2 = u2.id
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset])
    ]);

    // Get total count for pagination
    const totalResult = await executeQuery('SELECT COUNT(*) as total FROM shows_contacts');
    const total = totalResult[0]?.total || 0;

    const networkData = {
      statistics: {
        total: totalConnections[0]?.count || 0,
        active: activeConnections[0]?.count || 0,
        pending: pendingConnections[0]?.count || 0
      },
      topStudios: topConnectedStudios || [],
      connections: recentConnections || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };

    return NextResponse.json(networkData);
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    );
  }
}
