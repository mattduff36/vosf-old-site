import { NextResponse } from 'next/server';
import { listContacts, getConnection } from '../../../lib/database';
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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get contacts using new schema
    const contactsData = await listContacts({ limit, offset });
    
    // Get additional network statistics
    const db = await getConnection();
    const [totalConnections] = await Promise.all([
      db.execute('SELECT COUNT(*) as c FROM contacts')
    ]);

    // Format connections for compatibility with existing frontend
    const formattedConnections = contactsData.contacts.map(contact => ({
      id: contact.id,
      accepted: 1, // All contacts are considered connected in new schema
      studio1_username: contact.name || 'Unknown',
      studio1_name: contact.name || 'Unknown',
      studio1_email: contact.email || '',
      studio2_username: 'VOSF Network',
      studio2_name: 'VOSF Network',
      studio2_email: '',
      message: contact.message || '',
      phone: contact.phone || '',
      created_at: contact.created_at
    }));

    const networkData = {
      statistics: {
        total: Number(totalConnections.rows[0]?.c || 0),
        active: Number(totalConnections.rows[0]?.c || 0), // All connections are active
        pending: 0 // No pending concept in new schema
      },
      topStudios: [], // Could be implemented later if needed
      connections: formattedConnections,
      pagination: contactsData.pagination
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
