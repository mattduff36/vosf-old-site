'use client';

import { useState, useEffect } from 'react';

export default function EnhancedStudioProfile({ studioId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studioId) {
      fetchProfile();
    }
  }, [studioId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vosf/studios/${studioId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionName = (connectionNumber) => {
    const connections = {
      1: 'Source Connect',
      2: 'Source Connect Now', 
      3: 'Phone Patch',
      4: 'Session Link Pro',
      5: 'Audio TX',
      6: 'Cleanfeed',
      7: 'Riverside',
      8: 'Google Hangouts'
    };
    return connections[connectionNumber] || `Connection ${connectionNumber}`;
  };

  const getConnectionIcon = (connectionNumber) => {
    const icons = {
      1: '🔗', 2: '🔗', 3: '📞', 4: '🎧', 
      5: '📡', 6: '🧹', 7: '🏞️', 8: '💬'
    };
    return icons[connectionNumber] || '🔌';
  };

  const formatRate = (rate) => {
    if (!rate) return null;
    // Handle HTML entities
    return rate.replace(/&pound;/g, '£').replace(/&amp;/g, '&');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium">Error Loading Profile</h3>
        <p className="text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-200">
                <span className="text-white text-2xl font-bold">
                  {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.display_name || profile.username}
            </h1>
            {profile.display_name && profile.username && (
              <p className="text-lg text-gray-600 mb-2">@{profile.username}</p>
            )}
            
            {profile.category && (
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🏷️ {profile.category}
                </span>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center text-gray-600 mb-2">
                <span className="mr-2">📍</span>
                <span>{profile.location}</span>
              </div>
            )}

            <div className="flex items-center text-gray-600 mb-2">
              <span className="mr-2">📅</span>
              <span>Member since {new Date(profile.joined).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      {profile.about && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📖 About</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📞 Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <span className="mr-3">📧</span>
            <a href={`mailto:${profile.email}`} className="text-blue-600 hover:text-blue-800">
              {profile.email}
            </a>
          </div>
          
          {profile.phone && (
            <div className="flex items-center">
              <span className="mr-3">📱</span>
              <a href={`tel:${profile.phone}`} className="text-blue-600 hover:text-blue-800">
                {profile.phone}
              </a>
            </div>
          )}
          
          {profile.url && (
            <div className="flex items-center">
              <span className="mr-3">🌐</span>
              <a 
                href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {profile.url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Rates Section */}
      {profile.rates && profile.rates.showrates && (profile.rates.rate1 || profile.rates.rate2 || profile.rates.rate3) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.rates.rate1 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatRate(profile.rates.rate1)}</div>
                <div className="text-sm text-gray-600">15 minutes</div>
              </div>
            )}
            {profile.rates.rate2 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatRate(profile.rates.rate2)}</div>
                <div className="text-sm text-gray-600">30 minutes</div>
              </div>
            )}
            {profile.rates.rate3 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{formatRate(profile.rates.rate3)}</div>
                <div className="text-sm text-gray-600">60 minutes</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connections Section */}
      {profile.connections && Object.values(profile.connections).some(Boolean) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔌 Connections</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(profile.connections).map(([key, value]) => {
              if (!value) return null;
              const connectionNumber = key.replace('connection', '');
              return (
                <div key={key} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="mr-2 text-lg">{getConnectionIcon(connectionNumber)}</span>
                  <span className="text-sm font-medium text-green-800">
                    {getConnectionName(connectionNumber)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Media Section */}
      {profile.social && Object.values(profile.social).some(Boolean) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🌐 Social Media</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.social.twitter && profile.display?.twittershow && (
              <a 
                href={profile.social.twitter.startsWith('http') ? profile.social.twitter : `https://twitter.com/${profile.social.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="mr-2">🐦</span>
                <span className="text-sm font-medium text-blue-800">Twitter</span>
              </a>
            )}
            
            {profile.social.facebook && profile.display?.facebookshow && (
              <a 
                href={profile.social.facebook.startsWith('http') ? profile.social.facebook : `https://facebook.com/${profile.social.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="mr-2">📘</span>
                <span className="text-sm font-medium text-blue-800">Facebook</span>
              </a>
            )}
            
            {profile.social.youtube && profile.display?.youtubepageshow && (
              <a 
                href={profile.social.youtube.startsWith('http') ? profile.social.youtube : `https://youtube.com/${profile.social.youtube}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <span className="mr-2">📺</span>
                <span className="text-sm font-medium text-red-800">YouTube</span>
              </a>
            )}
            
            {profile.social.linkedin && profile.display?.linkedinshow && (
              <a 
                href={profile.social.linkedin.startsWith('http') ? profile.social.linkedin : `https://linkedin.com/in/${profile.social.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="mr-2">💼</span>
                <span className="text-sm font-medium text-blue-800">LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Media Links Section */}
      {profile.media && Object.values(profile.media).some(Boolean) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🎵 Media & Demos</h2>
          <div className="space-y-3">
            {profile.media.youtube && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="mr-3">📺</span>
                <a 
                  href={`https://youtube.com/watch?v=${profile.media.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  YouTube Demo
                </a>
              </div>
            )}
            
            {profile.media.soundcloudlink && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="mr-3">🎵</span>
                <a 
                  href={profile.media.soundcloudlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  SoundCloud Demo
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Section (remove in production) */}
      {profile._meta && Object.keys(profile._meta).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Profile Data (Debug)</h2>
          <div className="text-xs text-gray-600 space-y-1">
            {Object.entries(profile._meta).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-mono w-32 flex-shrink-0">{key}:</span>
                <span className="font-mono">{String(value).substring(0, 100)}{String(value).length > 100 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
