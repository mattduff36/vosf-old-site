'use client';

import { useState, useEffect } from 'react';

export default function AdminStatsCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p className="text-red-800">Failed to load statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Studios',
      value: stats.totalStudios || 0,
      icon: '🎭',
      color: 'blue',
      description: 'Studio profiles in database'
    },
    {
      title: 'Complete Profiles',
      value: stats.profileCompleteness || 0,
      icon: '✅',
      color: 'green',
      description: `${stats.completenessPercentage || 0}% with key info filled`
    },
    {
      title: 'With Avatars',
      value: stats.studiosWithAvatars || 0,
      icon: '🖼️',
      color: 'purple',
      description: `${stats.avatarPercentage || 0}% have profile images`
    },
    {
      title: 'With Rates',
      value: stats.studiosWithRates || 0,
      icon: '💰',
      color: 'orange',
      description: `${stats.ratesPercentage || 0}% have pricing info`
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg border ${getColorClasses(card.color)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{card.title}</p>
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
              <p className="text-xs opacity-60 mt-1">{card.description}</p>
            </div>
            <div className="text-3xl opacity-75">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
