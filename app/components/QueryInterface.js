'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QueryInterface() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [browseResults, setBrowseResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const rowsPerPage = 50;

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/database/tables');
      if (response.status === 401) {
        router.push('/');
        return;
      }
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      setError('Failed to fetch tables');
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

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setBrowseResults(null);

    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Query failed');
        setResults(null);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const browseTable = async (tableName, page = 0) => {
    setLoading(true);
    setError('');
    setResults(null);
    setSelectedTable(tableName);
    setCurrentPage(page);

    try {
      const offset = page * rowsPerPage;
      const response = await fetch(
        `/api/database/browse?table=${encodeURIComponent(tableName)}&limit=${rowsPerPage}&offset=${offset}`
      );

      const data = await response.json();

      if (response.ok) {
        setBrowseResults(data);
      } else {
        setError(data.error || 'Browse failed');
        setBrowseResults(null);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setBrowseResults(null);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data, title, stats) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data found.
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          {stats && (
            <div className="flex space-x-4 text-sm text-gray-600">
              {stats}
            </div>
          )}
        </div>
        <div className="table-container max-h-96 overflow-auto">
          <table className="table">
            <thead className="sticky top-0">
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column} className="max-w-xs truncate">
                      {row[column] === null ? (
                        <span className="text-gray-400 italic">NULL</span>
                      ) : (
                        String(row[column]).substring(0, 200)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const totalPages = browseResults ? Math.ceil(browseResults.total / rowsPerPage) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Database Query Interface
            </h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table}
                    onClick={() => browseTable(table)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedTable === table
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <strong>Total Tables:</strong> {tables.length}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Query Editor */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">SQL Query Editor</h2>
              <div className="space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your SELECT query here..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
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
                  Example: <code className="bg-gray-100 px-1 rounded">SELECT * FROM users LIMIT 10</code>
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Query Results */}
            {results && (
              <div className="card p-6">
                {renderTable(
                  results.data,
                  'Query Results',
                  <div className="flex space-x-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {results.rowCount} rows
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {results.executionTime}ms
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Browse Results */}
            {browseResults && (
              <div className="card p-6">
                {renderTable(
                  browseResults.data,
                  `Table: ${selectedTable}`,
                  <div className="flex space-x-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Total: {browseResults.total.toLocaleString()} rows
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      Showing: {currentPage * rowsPerPage + 1}-{Math.min((currentPage + 1) * rowsPerPage, browseResults.total)}
                    </span>
                  </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <button
                      onClick={() => browseTable(selectedTable, currentPage - 1)}
                      disabled={currentPage === 0 || loading}
                      className="btn-outline disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-4 py-2 text-sm text-gray-700">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => browseTable(selectedTable, currentPage + 1)}
                      disabled={currentPage >= totalPages - 1 || loading}
                      className="btn-outline disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
