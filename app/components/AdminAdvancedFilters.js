'use client';

import { useState, useEffect } from 'react';

export default function AdminAdvancedFilters({ onFiltersChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    joinedAfter: '',
    joinedBefore: '',
    hasAvatar: '',
    sortBy: 'joined',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      joinedAfter: '',
      joinedBefore: '',
      hasAvatar: '',
      sortBy: 'joined',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'joined' && value !== 'desc'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">🔍 Advanced Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide Filters' : 'Show More Filters'}
          </button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Studios
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Name, username, email..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="joined">Join Date</option>
              <option value="username">Username</option>
              <option value="display_name">Display Name</option>
              <option value="email">Email</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="desc">↓ Desc</option>
              <option value="asc">↑ Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joined After
            </label>
            <input
              type="date"
              value={filters.joinedAfter}
              onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joined Before
            </label>
            <input
              type="date"
              value={filters.joinedBefore}
              onChange={(e) => handleFilterChange('joinedBefore', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar Status
            </label>
            <select
              value={filters.hasAvatar}
              onChange={(e) => handleFilterChange('hasAvatar', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Studios</option>
              <option value="1">Has Avatar</option>
              <option value="0">No Avatar</option>
            </select>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{filters.search}"
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Status: {filters.status === '1' ? 'Active' : 'Inactive'}
              </span>
            )}
            {filters.joinedAfter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                After: {filters.joinedAfter}
              </span>
            )}
            {filters.joinedBefore && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Before: {filters.joinedBefore}
              </span>
            )}
            {filters.hasAvatar && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Avatar: {filters.hasAvatar === '1' ? 'Has Avatar' : 'No Avatar'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
