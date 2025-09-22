'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminBulkOperations from './AdminBulkOperations';
import AdminAdvancedFilters from './AdminAdvancedFilters';
import AdminStatsCards from './AdminStatsCards';
import StudioProfileCard from './StudioProfileCard';
import { useNavigationHistory } from './NavigationHistory';
import AdvancedStudioEditor from './AdvancedStudioEditor';

export default function AdminStudioManager() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [advancedEditingStudio, setAdvancedEditingStudio] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedStudios, setSelectedStudios] = useState([]);
  

  const fetchStudios = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/studios?${params}`);
      if (!response.ok) throw new Error('Failed to fetch studios');

      const data = await response.json();
      setStudios(data.studios || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchStudios();
  }, [fetchStudios]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  }, []);

  const handleBulkAction = async (action, studioIds) => {
    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, studioIds })
      });

      if (action === 'export') {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studios_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      if (!response.ok) throw new Error('Bulk operation failed');
      
      const result = await response.json();
      alert(result.message);
      
      // Refresh the studios list
      fetchStudios();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSelectStudio = (studioId, isSelected) => {
    setSelectedStudios(prev => 
      isSelected 
        ? [...prev, studioId]
        : prev.filter(id => id !== studioId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedStudios(isSelected ? studios.map(studio => studio.id) : []);
  };

  const handleClearSelection = () => {
    setSelectedStudios([]);
  };


  const handleAdvancedEdit = (studio) => {
    setAdvancedEditingStudio(studio);
    setShowAdvancedEditor(true);
  };

  const handleDeleteStudio = async (studioId) => {
    if (!confirm('Are you sure you want to delete this studio? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/studios/${studioId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete studio');
      
      alert('Studio deleted successfully');
      fetchStudios();
    } catch (error) {
      alert(`Error deleting studio: ${error.message}`);
    }
  };


  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAdvancedEditorClose = () => {
    setShowAdvancedEditor(false);
    setAdvancedEditingStudio(null);
  };

  const handleAdvancedEditorSave = () => {
    setShowAdvancedEditor(false);
    setAdvancedEditingStudio(null);
    fetchStudios(); // Refresh the list
  };


  if (showAdvancedEditor) {
    return (
      <AdvancedStudioEditor
        studioId={advancedEditingStudio?.id}
        onSave={handleAdvancedEditorSave}
        onCancel={handleAdvancedEditorClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Studio Management</h1>
          <p className="text-gray-600">Manage studio profiles, bulk operations, and user data</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="/dashboard/query"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Custom Queries"
          >
            <span className="mr-2">💻</span>
            <span className="hidden sm:inline">SQL Query</span>
          </a>
          <a
            href="/dashboard/browse"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Raw Data"
          >
            <span className="mr-2">📋</span>
            <span className="hidden sm:inline">Browse Tables</span>
          </a>
          <a
            href="/dashboard/schema"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Database Structure"
          >
            <span className="mr-2">🗂️</span>
            <span className="hidden sm:inline">Schema</span>
          </a>
        </div>
      </div>

      {/* Statistics Cards */}
      <AdminStatsCards />

      {/* Advanced Filters */}
      <AdminAdvancedFilters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Bulk Operations */}
      <AdminBulkOperations
        selectedStudios={selectedStudios}
        onBulkAction={handleBulkAction}
        onClearSelection={handleClearSelection}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={fetchStudios}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Studios Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Left side - Select All checkbox */}
            <div className="flex items-center">
              {studios.length > 0 && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedStudios.length === studios.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </label>
              )}
            </div>

            {/* Center - Studios title */}
            <h2 className="text-lg font-semibold text-gray-900">
              Studios ({pagination.total || 0})
            </h2>

          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading studios...</p>
          </div>
        ) : studios.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No studios found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Studio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studios.map((studio) => (
                    <tr key={studio.id} className={selectedStudios.includes(studio.id) ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudios.includes(studio.id)}
                          onChange={(e) => handleSelectStudio(studio.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {studio.avatar_url ? (
                            <img
                              src={studio.avatar_url}
                              alt={studio.display_name}
                              className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <span className="text-gray-500 text-sm font-medium">
                                {studio.display_name?.charAt(0) || studio.username?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {studio.display_name || studio.username}
                            </div>
                            <div className="text-sm text-gray-500">@{studio.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{studio.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          studio.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {studio.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(studio.joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAdvancedEdit(studio)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudio(studio.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}