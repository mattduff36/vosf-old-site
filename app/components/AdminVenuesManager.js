'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminVenuesManager() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hasCoords, setHasCoords] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search
      });

      if (hasCoords !== '') params.append('hasCoords', hasCoords);

      const response = await fetch(`/api/admin/venues?${params}`);
      if (!response.ok) throw new Error('Failed to fetch venues');

      const data = await response.json();
      setVenues(data.venues || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, hasCoords]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      const url = editingVenue 
        ? `/api/admin/venues/${editingVenue.id}`
        : '/api/admin/venues';
      
      const method = editingVenue ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save venue');
      }

      setShowForm(false);
      setEditingVenue(null);
      fetchVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (venue) => {
    if (!confirm(`Are you sure you want to delete venue "${venue.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/venues/${venue.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete venue');
      
      fetchVenues();
    } catch (err) {
      setError(err.message);
    }
  };

  const VenueForm = ({ venue, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
      name: venue?.name || '',
      description: venue?.description || '',
      lat: venue?.lat || '',
      lon: venue?.lon || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Convert coordinates to numbers or null
      const processedData = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lon: formData.lon ? parseFloat(formData.lon) : null
      };
      
      onSubmit(processedData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-90 to 90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lon}
                  onChange={(e) => setFormData(prev => ({ ...prev, lon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-180 to 180"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (venue ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && venues.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Venues Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Venue
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search venues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={hasCoords}
          onChange={(e) => setHasCoords(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Venues</option>
          <option value="1">With Coordinates</option>
          <option value="0">Without Coordinates</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {venues.map((venue) => (
            <li key={venue.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                    {venue.lat && venue.lon && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📍 Located
                      </span>
                    )}
                  </div>
                  {venue.description && (
                    <p className="text-sm text-gray-600 mt-1">{venue.description}</p>
                  )}
                  {venue.lat && venue.lon && (
                    <p className="text-xs text-gray-400 mt-1">
                      Coordinates: {parseFloat(venue.lat).toFixed(6)}, {parseFloat(venue.lon).toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {venue.lat && venue.lon && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Map
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditingVenue(venue);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(venue)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <VenueForm
          venue={editingVenue}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingVenue(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}
