'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const mainNavigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '🏠',
    description: 'Overview & Statistics'
  },
  {
    name: 'Studios',
    href: '/dashboard/studios',
    icon: '🎭',
    description: 'Studio Directory'
  },
  {
    name: 'Network',
    href: '/dashboard/network',
    icon: '🤝',
    description: 'Studio Connections'
  },
  {
    name: 'Venues',
    href: '/dashboard/venues',
    icon: '📍',
    description: 'Recording Locations'
  },
  {
    name: 'FAQ',
    href: '/dashboard/faq',
    icon: '❓',
    description: 'Knowledge Base'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: '📊',
    description: 'Data Insights'
  }
];

const settingsMenuItems = [
  {
    name: 'Admin',
    href: '/dashboard/admin',
    icon: '⚙️',
    description: 'Manage Studios'
  },
  {
    name: 'SQL Query',
    href: '/dashboard/query',
    icon: '💻',
    description: 'Custom Queries'
  },
  {
    name: 'Browse Tables',
    href: '/dashboard/browse',
    icon: '📋',
    description: 'Raw Data'
  },
  {
    name: 'Schema',
    href: '/dashboard/schema',
    icon: '🗂️',
    description: 'Database Structure'
  }
];

// Combine all items for mobile navigation
const allNavigationItems = [...mainNavigationItems, ...settingsMenuItems];

export default function VOSFNavigation() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isSettingsActive = () => {
    return settingsMenuItems.some(item => isActive(item.href));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left-aligned Navigation */}
          <div className="hidden lg:flex lg:space-x-1 lg:items-center">
            {mainNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                title={item.description}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Settings Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`${
                  isSettingsActive()
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                title="Settings"
              >
                <span className="mr-2">⚙️</span>
                <span className="hidden sm:inline">Settings</span>
                <svg
                  className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                    isSettingsOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Settings Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {settingsMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        } group flex items-center px-4 py-2 text-sm transition-colors duration-200`}
                        onClick={() => setIsSettingsOpen(false)}
                        title={item.description}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST" className="inline">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <span className="mr-2">🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-64 overflow-y-auto">
          {allNavigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
              <span className="block text-xs text-gray-500 ml-6">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
