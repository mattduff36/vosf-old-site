import { NextResponse } from 'next/server';
import { getTablesByDatabase, getDatabaseList } from '../../../lib/database.js';

export async function GET() {
  try {
    const tablesByDatabase = await getTablesByDatabase();
    const databaseList = await getDatabaseList();
    
    return NextResponse.json({
      success: true,
      databases: tablesByDatabase,
      metadata: databaseList,
      totalDatabases: Object.keys(tablesByDatabase).length,
      totalTables: Object.values(tablesByDatabase).reduce((total, db) => total + db.tables.length, 0)
    });
  } catch (error) {
    console.error('Database list API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve database list',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


