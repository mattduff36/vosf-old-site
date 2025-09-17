import { NextResponse } from 'next/server';
import { getDashboardStats, getRecentConnections } from '../../../lib/database';
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

    // Get dashboard statistics using new schema functions
    const [stats, recentConnections] = await Promise.all([
      getDashboardStats(),
      getRecentConnections()
    ]);

    const dashboardData = {
      studios: {
        total: stats.studios,
        active: stats.studios // In new schema, all non-stub users are considered active
      },
      connections: {
        total: stats.connections,
        recent: recentConnections
      },
      venues: {
        total: stats.venues
      },
      faqs: {
        total: stats.faqs
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
