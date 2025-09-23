'use client';
import { useState, useEffect } from 'react';

// Helper function to decode HTML entities on the frontend
function decodeHtmlEntities(str) {
  if (!str) return str;
  
  const htmlEntities = {
    '&pound;': '£',
    '&euro;': '€',
    '&dollar;': '$',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
}

export default function AdvancedStudioEditor({ studioId, onSave, onCancel }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [images, setImages] = useState([]);
  

  useEffect(() => {
    if (studioId) {
      fetchProfile();
      fetchImages();
    }
  }, [studioId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/admin/studios/${studioId}`);
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/admin/studios/${studioId}/images`);
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleMetaChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      _meta: {
        ...prev._meta,
        [key]: value
      }
    }));
  };

  const handleBasicChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/studios/${studioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          meta: profile._meta
        }),
      });

      if (response.ok) {
        onSave?.();
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('studioId', studioId);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchImages(); // Refresh images
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleImageDelete = async (imageId) => {
    try {
      const response = await fetch(`/api/admin/studios/${studioId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchImages(); // Refresh images
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-red-600">Profile not found</div>;
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '👤' },
    { id: 'contact', name: 'Contact', icon: '📞' },
    { id: 'social', name: 'Social Media', icon: '🌐' },
    { id: 'media', name: 'Media Links', icon: '🎵' },
    { id: 'connections', name: 'Connections', icon: '🔗' },
    { id: 'location', name: 'Location', icon: '📍' },
    { id: 'rates', name: 'Rates & Display', icon: '💰' },
    { id: 'images', name: 'Images', icon: '🖼️' },
    { id: 'advanced', name: 'Advanced', icon: '⚙️' }
  ];

  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={profile.username || ''}
            onChange={(e) => handleBasicChange('username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. VoiceoverGuy"
          />
          <p className="text-xs text-gray-500 mt-1">This is used in URLs and should be unique</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
          <input
            type="text"
            value={profile._meta?.first_name || ''}
            onChange={(e) => handleMetaChange('first_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. VoiceoverGuy - Yorkshire Voice Recording Studio"
          />
          <p className="text-xs text-gray-500 mt-1">This is the studio display name shown in listings</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => handleBasicChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short About</label>
        <textarea
          value={profile._meta?.shortabout || ''}
          onChange={(e) => handleMetaChange('shortabout', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full About</label>
        <textarea
            value={decodeHtmlEntities(profile._meta?.about) || ''}
            onChange={(e) => handleMetaChange('about', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={profile.status || 'active'}
            onChange={(e) => handleBasicChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.verified === '1'}
              onChange={(e) => handleMetaChange('verified', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Verified</span>
          </label>
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.featured === '1'}
              onChange={(e) => handleMetaChange('featured', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Featured</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={profile._meta?.phone || ''}
            onChange={(e) => handleMetaChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            type="url"
            value={profile._meta?.url || ''}
            onChange={(e) => handleMetaChange('url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Display Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showemail === '1'}
              onChange={(e) => handleMetaChange('showemail', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Email</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showphone === '1'}
              onChange={(e) => handleMetaChange('showphone', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Phone</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showmap === '1'}
              onChange={(e) => handleMetaChange('showmap', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Map</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showdirections === '1'}
              onChange={(e) => handleMetaChange('showdirections', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Directions</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showaddress === '1'}
              onChange={(e) => handleMetaChange('showaddress', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Address</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.showshort === '1'}
              onChange={(e) => handleMetaChange('showshort', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Short About</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
          <input
            type="text"
            value={profile._meta?.twitter || ''}
            onChange={(e) => handleMetaChange('twitter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.twittershow === '1'}
              onChange={(e) => handleMetaChange('twittershow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Twitter</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
          <input
            type="text"
            value={profile._meta?.facebook || ''}
            onChange={(e) => handleMetaChange('facebook', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.facebookshow === '1'}
              onChange={(e) => handleMetaChange('facebookshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Facebook</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
          <input
            type="url"
            value={profile._meta?.linkedin || ''}
            onChange={(e) => handleMetaChange('linkedin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.linkedinshow === '1'}
              onChange={(e) => handleMetaChange('linkedinshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show LinkedIn</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
          <input
            type="text"
            value={profile._meta?.instagram || ''}
            onChange={(e) => handleMetaChange('instagram', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.instagramshow === '1'}
              onChange={(e) => handleMetaChange('instagramshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Instagram</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Page</label>
          <input
            type="url"
            value={profile._meta?.youtubepage || ''}
            onChange={(e) => handleMetaChange('youtubepage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.youtubepageshow === '1'}
              onChange={(e) => handleMetaChange('youtubepageshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show YouTube</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud</label>
          <input
            type="url"
            value={profile._meta?.soundcloud || ''}
            onChange={(e) => handleMetaChange('soundcloud', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.soundcloudshow === '1'}
              onChange={(e) => handleMetaChange('soundcloudshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show SoundCloud</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pinterest</label>
          <input
            type="url"
            value={profile._meta?.pinterest || ''}
            onChange={(e) => handleMetaChange('pinterest', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center mt-6">
            <input
              type="checkbox"
              checked={profile._meta?.pinterestshow === '1'}
              onChange={(e) => handleMetaChange('pinterestshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Pinterest</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
          <input
            type="text"
            value={profile._meta?.tiktok || ''}
            onChange={(e) => handleMetaChange('tiktok', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
          <input
            type="text"
            value={profile._meta?.youtube || ''}
            onChange={(e) => handleMetaChange('youtube', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Video ID only (e.g., dQw4w9WgXcQ)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vimeo Page</label>
          <input
            type="url"
            value={profile._meta?.vimeopage || ''}
            onChange={(e) => handleMetaChange('vimeopage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={profile._meta?.vimeopageshow === '1'}
              onChange={(e) => handleMetaChange('vimeopageshow', e.target.checked ? '1' : '0')}
              className="mr-2"
            />
            <span className="text-sm">Show Vimeo Page</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud Link 1</label>
          <input
            type="url"
            value={profile._meta?.soundcloudlink || ''}
            onChange={(e) => handleMetaChange('soundcloudlink', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud Link 2</label>
          <input
            type="url"
            value={profile._meta?.soundcloudlink2 || ''}
            onChange={(e) => handleMetaChange('soundcloudlink2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud Link 3</label>
          <input
            type="url"
            value={profile._meta?.soundcloudlink3 || ''}
            onChange={(e) => handleMetaChange('soundcloudlink3', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud Link 4</label>
          <input
            type="url"
            value={profile._meta?.soundcloudlink4 || ''}
            onChange={(e) => handleMetaChange('soundcloudlink4', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SoundCloud Username</label>
          <input
            type="text"
            value={profile._meta?.sc || ''}
            onChange={(e) => handleMetaChange('sc', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderConnectionsTab = () => {
    const connectionMethods = [
      { id: 1, name: 'Source Connect' },
      { id: 2, name: 'Source Connect Now' },
      { id: 3, name: 'Phone Patch' },
      { id: 4, name: 'Session Link Pro' },
      { id: 5, name: 'Zoom or Teams' },
      { id: 6, name: 'Cleanfeed' },
      { id: 7, name: 'Riverside' },
      { id: 8, name: 'Google Hangouts' },
      { id: 9, name: 'ISDN' },
      { id: 10, name: 'Skype' },
      { id: 11, name: 'Audio TX' },
      { id: 12, name: 'ipDTL' }
    ];

    return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Connection Methods</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {connectionMethods.map(method => (
            <label key={method.id} className="flex items-center">
              <input
                type="checkbox"
                checked={profile._meta?.[`connection${method.id}`] === '1'}
                onChange={(e) => handleMetaChange(`connection${method.id}`, e.target.checked ? '1' : '0')}
                className="mr-2"
              />
              <span className="text-sm">{method.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">Custom Connection Methods</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Connection 1</label>
            <input
              type="text"
              value={profile._meta?.custom_connection1 || ''}
              onChange={(e) => handleMetaChange('custom_connection1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom connection method"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Connection 2</label>
            <input
              type="text"
              value={profile._meta?.custom_connection2 || ''}
              onChange={(e) => handleMetaChange('custom_connection2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom connection method"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Connection 3</label>
            <input
              type="text"
              value={profile._meta?.custom_connection3 || ''}
              onChange={(e) => handleMetaChange('custom_connection3', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter custom connection method"
            />
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderHomeStudioTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">Home Studio Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Studio</label>
            <select
              value={profile._meta?.homestudio || ''}
              onChange={(e) => handleMetaChange('homestudio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not Set</option>
              <option value="1">Yes</option>
              <option value="2">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Studio 2</label>
            <select
              value={profile._meta?.homestudio2 || ''}
              onChange={(e) => handleMetaChange('homestudio2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not Set</option>
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home Studio 5</label>
            <input
              type="text"
              value={profile._meta?.homestudio5 || ''}
              onChange={(e) => handleMetaChange('homestudio5', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={profile._meta?.location || ''}
            onChange={(e) => handleMetaChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
          <input
            type="text"
            value={profile._meta?.locale || ''}
            onChange={(e) => handleMetaChange('locale', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
        <input
          type="text"
          value={profile._meta?.address || ''}
          onChange={(e) => handleMetaChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="text"
            value={profile._meta?.latitude || ''}
            onChange={(e) => handleMetaChange('latitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="text"
            value={profile._meta?.longitude || ''}
            onChange={(e) => handleMetaChange('longitude', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderRatesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">15 Minutes Rate</label>
          <input
            type="text"
            value={decodeHtmlEntities(profile._meta?.rates1) || ''}
            onChange={(e) => handleMetaChange('rates1', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. £80, $80, €80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">30 Minutes Rate</label>
          <input
            type="text"
            value={decodeHtmlEntities(profile._meta?.rates2) || ''}
            onChange={(e) => handleMetaChange('rates2', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. £100, $100, €100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">60 Minutes Rate</label>
          <input
            type="text"
            value={decodeHtmlEntities(profile._meta?.rates3) || ''}
            onChange={(e) => handleMetaChange('rates3', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. £125, $125, €125"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profile._meta?.showrates === '1'}
            onChange={(e) => handleMetaChange('showrates', e.target.checked ? '1' : '0')}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Show Rates</span>
        </label>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-3">Homepage Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homepage 1</label>
            <select
              value={profile._meta?.homepage1 || '0'}
              onChange={(e) => handleMetaChange('homepage1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homepage 2</label>
            <select
              value={profile._meta?.homepage2 || '0'}
              onChange={(e) => handleMetaChange('homepage2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="font-medium text-orange-900 mb-3">Theme Settings</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Home Color</label>
          <select
            value={profile._meta?.homecolour || '1'}
            onChange={(e) => handleMetaChange('homecolour', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Color 1</option>
            <option value="2">Color 2</option>
            <option value="3">Color 3</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderImagesTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-3">Upload New Image</h4>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files[0]) {
              handleImageUpload(e.target.files[0]);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={image.id || index} className="border border-gray-200 rounded-lg p-4">
            {image.cloudinary_url ? (
              <img
                src={image.cloudinary_url}
                alt={image.image_filename}
                className="w-full h-32 object-cover rounded mb-2"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium">{image.image_filename}</div>
              <div className="text-gray-500">{image.image_type}</div>
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={image.is_primary === 1}
                    onChange={(e) => {
                      // Handle primary image change
                    }}
                    className="mr-1"
                  />
                  <span className="text-xs">Primary</span>
                </label>
                <button
                  onClick={() => handleImageDelete(image.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No images uploaded yet
        </div>
      )}
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
          <input
            type="text"
            value={profile._meta?.last_login || ''}
            onChange={(e) => handleMetaChange('last_login', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Login IP</label>
          <input
            type="text"
            value={profile._meta?.last_login_ip || ''}
            onChange={(e) => handleMetaChange('last_login_ip', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
          <input
            type="text"
            value={profile._meta?.lastupdated || ''}
            onChange={(e) => handleMetaChange('lastupdated', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Messages</label>
          <select
            value={profile._meta?.email_messages || '0'}
            onChange={(e) => handleMetaChange('email_messages', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">Disabled</option>
            <option value="1">Enabled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CRB</label>
          <input
            type="text"
            value={profile._meta?.crb || ''}
            onChange={(e) => handleMetaChange('crb', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VON</label>
          <input
            type="text"
            value={profile._meta?.von || ''}
            onChange={(e) => handleMetaChange('von', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tour</label>
          <input
            type="text"
            value={profile._meta?.tour || ''}
            onChange={(e) => handleMetaChange('tour', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Advanced Studio Editor: {profile.display_name || profile.username}
        </h2>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'contact' && renderContactTab()}
        {activeTab === 'social' && renderSocialTab()}
        {activeTab === 'media' && renderMediaTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'location' && renderLocationTab()}
        {activeTab === 'rates' && renderRatesTab()}
        {activeTab === 'images' && renderImagesTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
