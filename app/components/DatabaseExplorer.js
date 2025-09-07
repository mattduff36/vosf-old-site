'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DatabaseExplorer() {
  const [mode, setMode] = useState('normal'); // 'normal' or 'advanced'
  const [overview, setOverview] = useState(null);
  const [databases, setDatabases] = useState(null);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSchema, setTableSchema] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('databases');
  const router = useRouter();

  useEffect(() => {
    fetchDatabases();
    fetchOverview();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/databases');
      if (response.status === 401) {
        router.push('/');
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setDatabases(data);
      } else {
        setError(data.error || 'Failed to fetch databases');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/overview');
      if (response.status === 401) {
        router.push('/');
        return;
      }
      const data = await response.json();
      if (response.ok) {
        setOverview(data);
      } else {
        setError(data.error || 'Failed to fetch overview');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableSchema = async (tableName) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/database/schema?table=${encodeURIComponent(tableName)}`);
      const data = await response.json();
      if (response.ok) {
        setTableSchema(data);
        setSelectedTable(tableName);
        setActiveTab('schema');
      } else {
        setError(data.error || 'Failed to fetch schema');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/database/search?term=${encodeURIComponent(searchTerm)}&includeData=true`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data);
        setActiveTab('search');
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (response.ok) {
        setQueryResults(data);
        setActiveTab('query');
      } else {
        setError(data.error || 'Query failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const generateSampleQueries = (tableName) => {
    return [
      `SELECT * FROM \`${tableName}\` LIMIT 10;`,
      `SELECT COUNT(*) as total_records FROM \`${tableName}\`;`,
      `SELECT * FROM \`${tableName}\` ORDER BY id DESC LIMIT 5;`,
      `DESCRIBE \`${tableName}\`;`
    ];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Database Overview</h3>
        <p className="text-blue-800 mb-2">Get a high-level view of your database structure and statistics.</p>
        <div className="text-sm text-blue-700">
          <p><strong>What you can see:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Total number of tables across all databases</li>
            <li>Database size and storage usage</li>
            <li>Table relationships and foreign keys</li>
            <li>Row counts and table details</li>
          </ul>
          <p className="mt-2"><strong>Actions:</strong> Click "Explore" to browse table data or "Query" to run SQL queries on specific tables.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900">Total Tables</h3>
          <p className="text-3xl font-bold text-blue-600">{overview?.totalTables || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900">Database Size</h3>
          <p className="text-3xl font-bold text-green-600">{overview?.totalSize || 0} MB</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900">Relationships</h3>
          <p className="text-3xl font-bold text-purple-600">{overview?.relationships?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Tables Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size (KB)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overview?.tables?.map((table) => (
                <tr key={table.TABLE_NAME} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {table.TABLE_NAME}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {table.TABLE_ROWS?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {Math.round((table.DATA_LENGTH + table.INDEX_LENGTH) / 1024) || 0}
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {table.TABLE_COMMENT || 'No comment'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => fetchTableSchema(table.TABLE_NAME)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Explore
                    </button>
                    <button
                      onClick={() => {
                        setQuery(`SELECT * FROM \`${table.TABLE_NAME}\` LIMIT 10;`);
                        setActiveTab('query');
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Query
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {overview?.relationships?.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Table Relationships</h3>
          <div className="space-y-2">
            {overview.relationships.map((rel, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="font-medium text-blue-600">{rel.TABLE_NAME}</span>
                <span className="text-gray-500">({rel.COLUMN_NAME})</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-green-600">{rel.REFERENCED_TABLE_NAME}</span>
                <span className="text-gray-500">({rel.REFERENCED_COLUMN_NAME})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTableSchema = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">📊 Table Schema Explorer</h3>
        <p className="text-indigo-800 mb-2">Detailed view of table structure, columns, indexes, and relationships.</p>
        <div className="text-sm text-indigo-700">
          <p><strong>Information displayed:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Columns:</strong> Name, data type, nullable, default values, primary keys</li>
            <li><strong>Foreign Keys:</strong> Relationships to other tables</li>
            <li><strong>Indexes:</strong> Database indexes for performance optimization</li>
            <li><strong>Statistics:</strong> Row count and storage size information</li>
          </ul>
          <p className="mt-2"><strong>Actions:</strong> Use sample queries to explore the table data or run custom queries.</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Table: {tableSchema?.tableName}</h2>
        <div className="flex space-x-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {tableSchema?.stats?.TABLE_ROWS?.toLocaleString() || 0} rows
          </span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {Math.round((tableSchema?.stats?.DATA_LENGTH + tableSchema?.stats?.INDEX_LENGTH) / 1024) || 0} KB
          </span>
        </div>
      </div>

      {tableSchema?.stats?.TABLE_COMMENT && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-800">{tableSchema.stats.TABLE_COMMENT}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Columns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nullable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extra</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableSchema?.columns?.map((column) => (
                <tr key={column.COLUMN_NAME} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {column.COLUMN_NAME}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {column.DATA_TYPE}
                    {column.CHARACTER_MAXIMUM_LENGTH && `(${column.CHARACTER_MAXIMUM_LENGTH})`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {column.IS_NULLABLE === 'YES' ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {column.COLUMN_DEFAULT || 'NULL'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {column.COLUMN_KEY && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        column.COLUMN_KEY === 'PRI' ? 'bg-red-100 text-red-800' :
                        column.COLUMN_KEY === 'UNI' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {column.COLUMN_KEY}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {column.EXTRA}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tableSchema?.foreignKeys?.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Foreign Key Relationships</h3>
          </div>
          <div className="p-6 space-y-2">
            {tableSchema.foreignKeys.map((fk, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="font-medium text-blue-600">{fk.COLUMN_NAME}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-green-600">{fk.REFERENCED_TABLE_NAME}</span>
                <span className="text-gray-500">({fk.REFERENCED_COLUMN_NAME})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'normal' && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            {generateSampleQueries(tableSchema?.tableName).map((sampleQuery, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(sampleQuery);
                  setActiveTab('query');
                }}
                className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded border text-sm font-mono"
              >
                {sampleQuery}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔍 Smart Search</h3>
        <p className="text-yellow-800 mb-2">Search across table names, column names, and actual data content.</p>
        <div className="text-sm text-yellow-700">
          <p><strong>Search examples:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>"user"</strong> - Find tables/columns containing "user"</li>
            <li><strong>"email"</strong> - Search for email-related data</li>
            <li><strong>"comment"</strong> - Find comment tables and data</li>
            <li><strong>"studio"</strong> - Search for studio-related information</li>
          </ul>
          <p className="mt-2"><strong>Results include:</strong> Matching table names, column names, and actual data rows (limited to 100 results per table).</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Search Database</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tables, columns, or data..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && performSearch()}
          />
          <button
            onClick={performSearch}
            disabled={loading || !searchTerm.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searchResults && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({searchResults.length} found)</h3>
          {searchResults.map((result, index) => (
            <div key={index} className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-blue-600">{result.tableName}</h4>
                  <p className="text-gray-600">{result.rowCount?.toLocaleString() || 0} rows</p>
                  {result.comment && <p className="text-sm text-gray-500 mt-1">{result.comment}</p>}
                </div>
                <button
                  onClick={() => fetchTableSchema(result.tableName)}
                  className="btn-outline"
                >
                  Explore Table
                </button>
              </div>

              {result.matchingColumns?.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Matching Columns:</h5>
                  <div className="flex flex-wrap gap-2">
                    {result.matchingColumns.map((col, colIndex) => (
                      <span key={colIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {col.COLUMN_NAME} ({col.DATA_TYPE})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.dataMatches?.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Sample Data Matches:</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(result.dataMatches[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.dataMatches.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {Object.values(row).map((value, valueIndex) => (
                              <td key={valueIndex} className="px-3 py-2 whitespace-nowrap text-gray-900 max-w-xs truncate">
                                {value === null ? <span className="text-gray-400 italic">NULL</span> : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.dataMatches.length > 3 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... and {result.dataMatches.length - 3} more matches
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQueryInterface = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">💻 SQL Query Interface</h3>
        <p className="text-purple-800 mb-2">Execute custom SQL SELECT queries to explore and analyze your data.</p>
        <div className="text-sm text-purple-700">
          <p><strong>Example queries:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>List all tables:</strong> <code className="bg-purple-100 px-1 rounded">SELECT name FROM sqlite_master WHERE type='table';</code></li>
            <li><strong>Count records:</strong> <code className="bg-purple-100 px-1 rounded">SELECT COUNT(*) FROM shows_users;</code></li>
            <li><strong>Browse data:</strong> <code className="bg-purple-100 px-1 rounded">SELECT * FROM community_comments LIMIT 10;</code></li>
            <li><strong>Table structure:</strong> <code className="bg-purple-100 px-1 rounded">PRAGMA table_info('shows_users');</code></li>
          </ul>
          <p className="mt-2"><strong>Security:</strong> Only SELECT statements are allowed. No data modification permitted.</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">SQL Query Editor</h3>
        <div className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SELECT query here..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="flex space-x-4">
            <button
              onClick={executeQuery}
              disabled={loading || !query.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
            <button
              onClick={() => setQuery('')}
              className="btn-outline"
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Security Note:</strong> Only SELECT queries are allowed.
          </p>
        </div>
      </div>

      {queryResults && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Query Results</h3>
            <div className="flex space-x-4">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {queryResults.rowCount} rows
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {queryResults.executionTime}ms
              </span>
            </div>
          </div>
          <div className="p-6">
            {queryResults.data.length === 0 ? (
              <p className="text-gray-500">No results found.</p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(queryResults.data[0]).map((column) => (
                        <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryResults.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {value === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : (
                              String(value).substring(0, 200)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDatabases = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">🗄️ Database Collection</h3>
        <p className="text-green-800 mb-2">Browse all imported databases and their tables organized by source.</p>
        <div className="text-sm text-green-700">
          <p><strong>Available databases:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Main Database (Shows):</strong> Core VOSF data with voice professionals and studios</li>
            <li><strong>Community Database:</strong> User comments, messages, and community features</li>
            <li><strong>FAQ Database:</strong> FAQ content and user sign-up system</li>
            <li><strong>Maps Database:</strong> Geographic points of interest and mapping data</li>
          </ul>
          <p className="mt-2"><strong>Actions:</strong> Click "Explore" to browse table contents or "Query" to run custom SQL queries.</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">VOSF Database Collection</h2>
        <div className="flex space-x-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {databases?.totalDatabases} databases
          </span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {databases?.totalTables} tables
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {Object.entries(databases?.databases || {}).map(([dbName, dbInfo]) => (
          <div key={dbName} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{dbName}</h3>
                <p className="text-sm text-gray-600 mt-1">{dbInfo.info?.description}</p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                  {dbInfo.tables?.length || 0} tables
                </span>
                {dbInfo.info?.prefix && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {dbInfo.info.prefix}*
                  </span>
                )}
              </div>
            </div>

            {dbInfo.tables && dbInfo.tables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Tables:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {dbInfo.tables.slice(0, 5).map((table) => (
                    <div key={table.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{table.displayName}</span>
                        <span className="text-xs text-gray-500">({table.rowCount} rows)</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTable(table.name);
                            fetchTableSchema(table.name);
                            setActiveTab('schema');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-900"
                        >
                          Explore
                        </button>
                        <button
                          onClick={() => {
                            setQuery(`SELECT * FROM "${table.name}" LIMIT 10;`);
                            setActiveTab('query');
                          }}
                          className="text-xs text-green-600 hover:text-green-900"
                        >
                          Query
                        </button>
                      </div>
                    </div>
                  ))}
                  {dbInfo.tables.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      ... and {dbInfo.tables.length - 5} more tables
                    </div>
                  )}
                </div>
              </div>
            )}

            {dbInfo.info?.import_date && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Imported: {new Date(dbInfo.info.import_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {databases?.metadata && databases.metadata.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Import Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Database</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tables</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Import Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {databases.metadata.map((meta) => (
                  <tr key={meta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {meta.database_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{meta.prefix}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {meta.table_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        meta.status === 'imported' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {meta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(meta.import_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Database Explorer
              </h1>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('normal')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    mode === 'normal' 
                      ? 'bg-white text-gray-900 shadow' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Normal Mode
                </button>
                <button
                  onClick={() => setMode('advanced')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    mode === 'advanced' 
                      ? 'bg-white text-gray-900 shadow' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Advanced Mode
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'databases', name: 'Databases', icon: '🗄️' },
              { id: 'overview', name: 'Database Overview', icon: '🏠' },
              { id: 'search', name: 'Smart Search', icon: '🔍' },
              { id: 'schema', name: 'Table Explorer', icon: '📊' },
              { id: 'query', name: 'SQL Query', icon: '💻' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {activeTab === 'databases' && databases && renderDatabases()}
            {activeTab === 'overview' && overview && renderOverview()}
            {activeTab === 'schema' && tableSchema && renderTableSchema()}
            {activeTab === 'search' && renderSearch()}
            {activeTab === 'query' && renderQueryInterface()}
          </>
        )}

        {/* AI Assistant Info Panel */}
        {mode === 'advanced' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🤖 AI Assistant Information</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Database:</strong> {overview?.databaseName}</p>
              <p><strong>Total Tables:</strong> {overview?.totalTables}</p>
              <p><strong>Key Tables:</strong> {overview?.tables?.slice(0, 5).map(t => t.TABLE_NAME).join(', ')}</p>
              <p><strong>Main Relationships:</strong> {overview?.relationships?.length} foreign key constraints</p>
              <p><strong>Search Capabilities:</strong> Full-text search across table names, columns, and data</p>
              <p><strong>Query Restrictions:</strong> SELECT statements only for security</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

