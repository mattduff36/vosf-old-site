'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminStudioForm from './AdminStudioForm';
import AdminBulkOperations from './AdminBulkOperations';
import AdminAdvancedFilters from './AdminAdvancedFilters';
import AdminStatsCards from './AdminStatsCards';
import StudioProfileCard from './StudioProfileCard';

export default function AdminStudioManager() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStudio, setEditingStudio] = useState(null);
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

  const handleCreateStudio = () => {
    setEditingStudio(null);
    setShowForm(true);
  };

  const handleEditStudio = (studio) => {
    setEditingStudio(studio);
    setShowForm(true);
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

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      const url = editingStudio 
        ? `/api/admin/studios/${editingStudio.id}`
        : '/api/admin/studios';
      
      const method = editingStudio ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save studio');

      const result = await response.json();
      alert(`Studio ${editingStudio ? 'updated' : 'created'} successfully`);
      
      setShowForm(false);
      setEditingStudio(null);
      fetchStudios();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (showForm) {
    return (
      <AdminStudioForm
        studio={editingStudio}
        onSubmit={handleFormSubmit}
        onCancel={() => setShowForm(false)}
        loading={formLoading}
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
        <button
          onClick={handleCreateStudio}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Add New Studio
        </button>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Studios ({pagination.total || 0})
            </h2>
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
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading studios...</p>
          </div>
        ) : studios.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No studios found matching your criteria.</p>
            <button
              onClick={handleCreateStudio}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Create the first studio
            </button>
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
                          studio.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {studio.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(studio.joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditStudio(studio)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudio(studio.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
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