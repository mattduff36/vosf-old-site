'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
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

export default function VOSFNavigation() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-2xl">🎭</span>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">VOSF Data Portal</h1>
                  <p className="text-xs text-gray-500">Voice Over Studio Finder</p>
                </div>
              </Link>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">

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

      {/* Desktop Navigation - Two Lines */}
      <div className="hidden md:block border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Primary Navigation Line */}
          <div className="flex justify-center py-2 space-x-1">
            {navigationItems.slice(0, 6).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                title={item.description}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          {/* Secondary Navigation Line */}
          <div className="flex justify-center py-2 border-t border-gray-100 space-x-1">
            {navigationItems.slice(6).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                title={item.description}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-64 overflow-y-auto">
          {navigationItems.map((item) => (
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
