'use client';

import { useState } from 'react';

export default function StudioProfileCard({ studio, showActions = false, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 1:
        return { text: 'Active', color: 'bg-green-100 text-green-800', icon: '✅' };
      case 0:
        return { text: 'Inactive', color: 'bg-red-100 text-red-800', icon: '❌' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  const getRoleInfo = (roleId) => {
    switch (roleId) {
      case 1:
        return { text: 'Administrator', color: 'bg-purple-100 text-purple-800', icon: '👑' };
      case 2:
        return { text: 'Premium User', color: 'bg-blue-100 text-blue-800', icon: '⭐' };
      case 0:
      default:
        return { text: 'Standard User', color: 'bg-gray-100 text-gray-800', icon: '👤' };
    }
  };

  const statusInfo = getStatusInfo(studio.status);
  const roleInfo = getRoleInfo(studio.role_id);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          {studio.avatar_url && !imageError ? (
            <img
              src={studio.avatar_url}
              alt={studio.display_name || studio.username}
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
              <span className="text-white text-xl font-bold">
                {(studio.display_name || studio.username || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {studio.display_name || studio.username}
              </h3>
              {studio.display_name && studio.username && (
                <p className="text-sm text-gray-500">@{studio.username}</p>
              )}
            </div>
            {showActions && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit?.(studio)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(studio)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <span className="mr-2">📧</span>
          <a 
            href={`mailto:${studio.email}`}
            className="text-blue-600 hover:text-blue-800 truncate"
          >
            {studio.email}
          </a>
        </div>
      </div>

      {/* Status and Role Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
          <span className="mr-1">{statusInfo.icon}</span>
          {statusInfo.text}
        </span>
        
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
          <span className="mr-1">{roleInfo.icon}</span>
          {roleInfo.text}
        </span>

        {studio.avatar_url && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="mr-1">🖼️</span>
            Has Avatar
          </span>
        )}
      </div>

      {/* Membership Information */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Member Since:</span>
            <p className="font-medium text-gray-900">{formatDate(studio.joined)}</p>
          </div>
          
          {studio.expiry_date && (
            <div>
              <span className="text-gray-500">Expires:</span>
              <p className="font-medium text-gray-900">{formatDate(studio.expiry_date)}</p>
            </div>
          )}
          
          <div>
            <span className="text-gray-500">Studio ID:</span>
            <p className="font-medium text-gray-900">#{studio.id}</p>
          </div>

          {studio.upgrade && (
            <div>
              <span className="text-gray-500">Upgrade Status:</span>
              <p className="font-medium text-gray-900">{studio.upgrade}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Actions */}
      {!showActions && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Full Profile
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Contact Studio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
