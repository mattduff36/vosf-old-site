import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '../../../lib/database.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const authenticated = cookieStore.get('authenticated');
    
    if (!authenticated || authenticated.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, studioIds } = await request.json();

    if (!action || !Array.isArray(studioIds) || studioIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and studioIds are required' },
        { status: 400 }
      );
    }

    const client = await getConnection();
    let result = { success: false, message: '', affectedCount: 0 };

    // Create placeholders for the IN clause
    const placeholders = studioIds.map(() => '?').join(',');

    switch (action) {
      case 'activate':
        const activateResult = await client.execute({
          sql: `UPDATE shows_users SET status = 1 WHERE id IN (${placeholders})`,
          args: studioIds
        });
        result = {
          success: true,
          message: `Successfully activated ${studioIds.length} studio(s)`,
          affectedCount: studioIds.length
        };
        break;

      case 'deactivate':
        const deactivateResult = await client.execute({
          sql: `UPDATE shows_users SET status = 0 WHERE id IN (${placeholders})`,
          args: studioIds
        });
        result = {
          success: true,
          message: `Successfully deactivated ${studioIds.length} studio(s)`,
          affectedCount: studioIds.length
        };
        break;

      case 'delete':
        const deleteResult = await client.execute({
          sql: `DELETE FROM shows_users WHERE id IN (${placeholders})`,
          args: studioIds
        });
        result = {
          success: true,
          message: `Successfully deleted ${studioIds.length} studio(s)`,
          affectedCount: studioIds.length
        };
        break;

      case 'export':
        // Get studio data for export
        const exportResult = await client.execute({
          sql: `
            SELECT 
              id, username, display_name, email, status, joined, avatar_url
            FROM shows_users 
            WHERE id IN (${placeholders})
            ORDER BY username
          `,
          args: studioIds
        });

        const csvData = generateCSV(exportResult.rows);
        
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="studios_export_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk operations API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

function generateCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}
