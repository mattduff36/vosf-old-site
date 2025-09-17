import { createClient } from '@libsql/client';

let tursoClient = null;

export async function getConnection() {
  try {
    if (!tursoClient) {
      tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      
      console.log('Turso database connected:', process.env.TURSO_DATABASE_URL);
    }
    return tursoClient;
  } catch (error) {
    console.error('Turso connection failed:', error);
    throw new Error(`Failed to connect to Turso database: ${error.message}`);
  }
}

export async function executeQuery(query, params = []) {
  try {
    const conn = await getConnection();
    
    // Execute query with parameters
    const result = await conn.execute({
      sql: query,
      args: params
    });
    
    return result.rows;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error('Query execution failed: ' + error.message);
  }
}

export async function getTables() {
  try {
    const results = await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_database_metadata' ORDER BY name");
    return results.map(row => row.name);
  } catch (error) {
    console.error('Failed to get tables:', error);
    throw new Error('Failed to retrieve tables');
  }
}

export async function getDatabaseList() {
  try {
    const results = await executeQuery("SELECT * FROM _database_metadata ORDER BY database_name");
    return results;
  } catch (error) {
    console.error('Failed to get database list:', error);
    return [];
  }
}

export async function getTablesByDatabase() {
  try {
    const databases = await getDatabaseList();
    const allTables = await getTables();
    
    const tablesByDatabase = {};
    
    // Initialize each database
    for (const db of databases) {
      tablesByDatabase[db.database_name] = {
        info: db,
        tables: []
      };
    }
    
    // Add tables to appropriate databases
    for (const tableName of allTables) {
      let assigned = false;
      
      for (const db of databases) {
        if (tableName.startsWith(db.prefix)) {
          const count = await executeQuery(`SELECT COUNT(*) as count FROM "${tableName}"`);
          tablesByDatabase[db.database_name].tables.push({
            name: tableName,
            displayName: tableName.replace(db.prefix, ''),
            rowCount: count[0].count
          });
          assigned = true;
          break;
        }
      }
      
      // Handle tables without prefix
      if (!assigned) {
        if (!tablesByDatabase['Other Tables']) {
          tablesByDatabase['Other Tables'] = {
            info: { database_name: 'Other Tables', description: 'Tables without database prefix' },
            tables: []
          };
        }
        const count = await executeQuery(`SELECT COUNT(*) as count FROM "${tableName}"`);
        tablesByDatabase['Other Tables'].tables.push({
          name: tableName,
          displayName: tableName,
          rowCount: count[0].count
        });
      }
    }
    
    return tablesByDatabase;
  } catch (error) {
    console.error('Failed to get tables by database:', error);
    throw new Error('Failed to retrieve tables by database');
  }
}

export async function getTableData(tableName, limit = 50, offset = 0) {
  try {
    // Validate table name to prevent SQL injection
    const tables = await getTables();
    if (!tables.includes(tableName)) {
      throw new Error('Invalid table name');
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM "${tableName}"`;
    const dataQuery = `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`;
    
    const [countResult, dataResult] = await Promise.all([
      executeQuery(countQuery),
      executeQuery(dataQuery, [limit, offset])
    ]);
    
    return {
      data: dataResult,
      total: countResult[0].total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Failed to get table data:', error);
    throw new Error('Failed to retrieve table data: ' + error.message);
  }
}

export async function executeSelectQuery(query) {
  // Basic security check - only allow SELECT statements
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery.startsWith('select')) {
    throw new Error('Only SELECT queries are allowed');
  }
  
  // Additional security checks
  const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
  for (const keyword of dangerousKeywords) {
    if (trimmedQuery.includes(keyword)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`);
    }
  }
  
  try {
    const startTime = Date.now();
    const results = await executeQuery(query);
    const executionTime = Date.now() - startTime;
    
    return {
      data: results,
      executionTime,
      rowCount: results.length
    };
  } catch (error) {
    console.error('SELECT query failed:', error);
    throw new Error('Query execution failed: ' + error.message);
  }
}

// Enhanced database analysis functions for SQLite
export async function getTableSchema(tableName) {
  try {
    const tables = await getTables();
    if (!tables.includes(tableName)) {
      throw new Error('Invalid table name');
    }
    
    // Get column information from Turso/LibSQL
    const columns = await executeQuery(`PRAGMA table_info("${tableName}")`);
    
    // Get foreign key information
    const foreignKeys = await executeQuery(`PRAGMA foreign_key_list("${tableName}")`);
    
    // Get index information
    const indexes = await executeQuery(`PRAGMA index_list("${tableName}")`);
    
    // Get table stats
    const countResult = await executeQuery(`SELECT COUNT(*) as row_count FROM "${tableName}"`);
    const tableStats = {
      row_count: countResult[0].row_count,
      table_name: tableName
    };
    
    return {
      tableName,
      columns: columns.map(col => ({
        COLUMN_NAME: col.name,
        DATA_TYPE: col.type,
        IS_NULLABLE: col.notnull ? 'NO' : 'YES',
        COLUMN_DEFAULT: col.dflt_value,
        COLUMN_KEY: col.pk ? 'PRI' : '',
        EXTRA: col.pk ? 'PRIMARY KEY' : ''
      })),
      foreignKeys: foreignKeys.map(fk => ({
        COLUMN_NAME: fk.from,
        REFERENCED_TABLE_NAME: fk.table,
        REFERENCED_COLUMN_NAME: fk.to,
        CONSTRAINT_NAME: `fk_${tableName}_${fk.from}`
      })),
      indexes: indexes.map(idx => ({
        INDEX_NAME: idx.name,
        NON_UNIQUE: idx.unique ? 0 : 1,
        INDEX_TYPE: 'BTREE'
      })),
      stats: tableStats
    };
  } catch (error) {
    console.error('Failed to get table schema:', error);
    throw new Error('Failed to retrieve table schema: ' + error.message);
  }
}

export async function getDatabaseOverview() {
  try {
    // Get all tables with basic info
    const tableNames = await getTables();
    const tables = [];
    
    for (const tableName of tableNames) {
      try {
        const countResult = await executeQuery(`SELECT COUNT(*) as row_count FROM "${tableName}"`);
        tables.push({
          TABLE_NAME: tableName,
          TABLE_ROWS: countResult[0].row_count,
          TABLE_COMMENT: ''
        });
      } catch (error) {
        console.warn(`Could not get row count for ${tableName}:`, error.message);
        tables.push({
          TABLE_NAME: tableName,
          TABLE_ROWS: 0,
          TABLE_COMMENT: 'Error getting row count'
        });
      }
    }
    
    // Get all foreign key relationships
    const relationships = [];
    for (const tableName of tableNames) {
      try {
        const foreignKeys = await executeQuery(`PRAGMA foreign_key_list("${tableName}")`);
        for (const fk of foreignKeys) {
          relationships.push({
            TABLE_NAME: tableName,
            COLUMN_NAME: fk.from,
            REFERENCED_TABLE_NAME: fk.table,
            REFERENCED_COLUMN_NAME: fk.to,
            CONSTRAINT_NAME: `fk_${tableName}_${fk.from}`
          });
        }
      } catch (error) {
        console.warn(`Could not get foreign keys for ${tableName}:`, error.message);
      }
    }
    
    return {
      tables,
      totalTables: tables.length,
      totalSize: 0, // Turso doesn't provide easy size calculation
      relationships,
      databaseName: 'Turso Database'
    };
  } catch (error) {
    console.error('Failed to get database overview:', error);
    throw new Error('Failed to retrieve database overview: ' + error.message);
  }
}

export async function searchTables(searchTerm, options = {}) {
  try {
    const { includeData = true, limit = 100 } = options;
    const results = [];
    
    const tableNames = await getTables();
    
    // Search in table names
    const matchingTables = tableNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    for (const tableName of matchingTables) {
      const result = {
        type: 'table',
        tableName: tableName,
        comment: '',
        rowCount: 0,
        matches: []
      };
      
      try {
        const countResult = await executeQuery(`SELECT COUNT(*) as count FROM "${tableName}"`);
        result.rowCount = countResult[0].count;
      } catch (error) {
        console.warn(`Could not get row count for ${tableName}:`, error.message);
      }
      
      if (includeData) {
        // Get column information
        const columns = await executeQuery(`PRAGMA table_info("${tableName}")`);
        
        // Search in column names
        const matchingColumns = columns.filter(col => 
          col.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        result.matchingColumns = matchingColumns.map(col => ({
          COLUMN_NAME: col.name,
          DATA_TYPE: col.type,
          COLUMN_COMMENT: ''
        }));
        
        // Search in actual data (limited)
        try {
          const textColumns = columns.filter(col => 
            ['text', 'varchar', 'char'].some(type => 
              col.type.toLowerCase().includes(type.toLowerCase())
            )
          );
          
          if (textColumns.length > 0) {
            const searchConditions = textColumns.map(col => 
              `"${col.name}" LIKE ?`
            ).join(' OR ');
            
            const searchParams = textColumns.map(() => `%${searchTerm}%`);
            
            const dataMatches = await executeQuery(`
              SELECT * FROM "${tableName}" 
              WHERE ${searchConditions} 
              LIMIT ${limit}
            `, searchParams);
            
            result.dataMatches = dataMatches;
          }
        } catch (dataError) {
          console.warn(`Could not search data in ${tableName}:`, dataError.message);
        }
      }
      
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw new Error('Search failed: ' + error.message);
  }
}

export async function getColumnAnalysis(tableName, columnName) {
  try {
    const tables = await getTables();
    if (!tables.includes(tableName)) {
      throw new Error('Invalid table name');
    }
    
    // Get column info
    const columns = await executeQuery(`PRAGMA table_info("${tableName}")`);
    const columnInfo = columns.find(col => col.name === columnName);
    
    if (!columnInfo) {
      throw new Error('Column not found');
    }
    
    // Get value distribution
    const distribution = await executeQuery(`
      SELECT 
        "${columnName}" as value,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "${tableName}"), 2) as percentage
      FROM "${tableName}"
      WHERE "${columnName}" IS NOT NULL
      GROUP BY "${columnName}"
      ORDER BY count DESC
      LIMIT 20
    `);
    
    // Get basic stats
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_rows,
        COUNT("${columnName}") as non_null_count,
        COUNT(DISTINCT "${columnName}") as unique_count,
        MIN("${columnName}") as min_value,
        MAX("${columnName}") as max_value
      FROM "${tableName}"
    `);
    
    return {
      columnInfo: {
        COLUMN_NAME: columnInfo.name,
        DATA_TYPE: columnInfo.type,
        IS_NULLABLE: columnInfo.notnull ? 'NO' : 'YES',
        COLUMN_DEFAULT: columnInfo.dflt_value,
        COLUMN_KEY: columnInfo.pk ? 'PRI' : ''
      },
      distribution,
      stats: stats[0]
    };
  } catch (error) {
    console.error('Column analysis failed:', error);
    throw new Error('Column analysis failed: ' + error.message);
  }
}

// ============================================================================
// NEW TURSO SCHEMA UTILITY FUNCTIONS
// ============================================================================

// Reusable SQL queries for the new schema
export const studiosCountSql = `
  SELECT COUNT(*) as c
  FROM users u
  JOIN profile p ON p.user_id = u.id
  WHERE COALESCE(u.status,'') <> 'stub'
`;

export const recentConnectionsSql = `
  SELECT id, name, email, phone, message, created_at
  FROM contacts
  ORDER BY datetime(created_at) DESC
  LIMIT 5
`;

export const analyticsSql = {
  connections: `SELECT COUNT(*) as c FROM contacts`,
  venuesTotal: `SELECT COUNT(*) as c FROM poi`,
  venuesWithCoords: `SELECT COUNT(*) as c FROM poi WHERE lat IS NOT NULL AND lon IS NOT NULL`,
  faqTotal: `SELECT COUNT(*) as c FROM faq`,
  faqAnswered: `SELECT COUNT(*) as c FROM faq`, // all considered answered
  firstUser: `SELECT MIN(created_at) as d FROM users WHERE COALESCE(status,'') <> 'stub'`,
  latestUser: `SELECT MAX(created_at) as d FROM users WHERE COALESCE(status,'') <> 'stub'`,
};

// Dashboard statistics using new schema
export async function getDashboardStats() {
  try {
    const db = await getConnection();
    const [studios, conns, venues, faqs] = await Promise.all([
      db.execute(studiosCountSql),
      db.execute(`SELECT COUNT(*) as c FROM contacts`),
      db.execute(`SELECT COUNT(*) as c FROM poi`),
      db.execute(`SELECT COUNT(*) as c FROM faq`),
    ]);
    
    return {
      studios: Number(studios.rows[0].c),
      connections: Number(conns.rows[0].c),
      venues: Number(venues.rows[0].c),
      faqs: Number(faqs.rows[0].c),
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw new Error('Failed to retrieve dashboard statistics');
  }
}

// Recent connections using new schema
export async function getRecentConnections() {
  try {
    const db = await getConnection();
    const result = await db.execute(recentConnectionsSql);
    return result.rows.map(x => ({
      id: x.id,
      name: x.name ?? "",
      message: x.message ?? "",
      created_at: x.created_at ?? "",
      status: "Connected",
    }));
  } catch (error) {
    console.error('Failed to get recent connections:', error);
    throw new Error('Failed to retrieve recent connections');
  }
}

// List studios with new schema (users + profile join, excluding stubs)
export async function listStudios({ q, hasCoords } = {}) {
  try {
    const db = await getConnection();
    const where = [
      `COALESCE(u.status,'') <> 'stub'`,
      q ? `(
        LOWER(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) LIKE ? OR
        LOWER(COALESCE(u.displayname,'')) LIKE ? OR
        LOWER(COALESCE(u.username,'')) LIKE ?
      )` : null,
      hasCoords ? `p.latitude IS NOT NULL AND p.longitude IS NOT NULL` : null,
    ].filter(Boolean).join(" AND ");

    const args = q ? Array(3).fill(`%${q.toLowerCase()}%`) : [];

    const sql = `
      SELECT u.id,
             COALESCE(TRIM(p.first_name||' '||p.last_name), u.displayname, u.username) as name,
             p.location, p.latitude, p.longitude, p.url, p.instagram, p.youtubepage
      FROM users u
      JOIN profile p ON p.user_id = u.id
      WHERE ${where}
      ORDER BY name ASC
    `;
    
    const result = await db.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('Failed to list studios:', error);
    throw new Error('Failed to retrieve studios list');
  }
}

// Get studio by ID with profile data
export async function getStudioById(id) {
  try {
    const db = await getConnection();
    const sql = `
      SELECT u.id, u.username, u.displayname, u.email, u.status, u.created_at,
             p.first_name, p.last_name, p.location, p.address, p.latitude, p.longitude,
             p.phone, p.url, p.instagram, p.youtubepage, p.about
      FROM users u
      JOIN profile p ON p.user_id = u.id
      WHERE u.id = ? AND COALESCE(u.status,'') <> 'stub'
    `;
    
    const result = await db.execute({ sql, args: [id] });
    return result.rows[0] || null;
  } catch (error) {
    console.error('Failed to get studio by ID:', error);
    throw new Error('Failed to retrieve studio details');
  }
}

// List venues from poi table
export async function listVenues({ search } = {}) {
  try {
    const db = await getConnection();
    let sql = `SELECT id, name, description, lat, lon FROM poi`;
    const args = [];
    
    if (search) {
      sql += ` WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?`;
      args.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }
    
    sql += ` ORDER BY name ASC`;
    
    const result = await db.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('Failed to list venues:', error);
    throw new Error('Failed to retrieve venues list');
  }
}

// List FAQ entries with sort_order
export async function listFAQ({ search } = {}) {
  try {
    const db = await getConnection();
    let sql = `SELECT id, question, answer, sort_order FROM faq`;
    const args = [];
    
    if (search) {
      sql += ` WHERE LOWER(question) LIKE ? OR LOWER(answer) LIKE ?`;
      args.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }
    
    sql += ` ORDER BY sort_order ASC, id ASC`;
    
    const result = await db.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('Failed to list FAQ:', error);
    throw new Error('Failed to retrieve FAQ list');
  }
}

// List contacts/connections
export async function listContacts({ limit = 20, offset = 0 } = {}) {
  try {
    const db = await getConnection();
    const sql = `
      SELECT id, name, email, phone, message, created_at
      FROM contacts
      ORDER BY datetime(created_at) DESC
      LIMIT ? OFFSET ?
    `;
    
    const result = await db.execute({ sql, args: [limit, offset] });
    
    // Get total count
    const countResult = await db.execute(`SELECT COUNT(*) as total FROM contacts`);
    const total = countResult.rows[0].total;
    
    return {
      contacts: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Failed to list contacts:', error);
    throw new Error('Failed to retrieve contacts list');
  }
}