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
    name: 'Admin',
    href: '/dashboard/admin',
    icon: '⚙️',
    description: 'Administration',
    submenu: [
      { name: 'Studios', href: '/dashboard/admin', description: 'Manage Studios' },
      { name: 'Contacts', href: '/dashboard/admin/contacts', description: 'Manage Contacts' },
      { name: 'Venues', href: '/dashboard/admin/venues', description: 'Manage Venues' },
      { name: 'FAQ', href: '/dashboard/admin/faq', description: 'Manage FAQ' }
    ]
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
        <div className="flex justify-between items-center h-16">
          {/* Left-aligned Navigation */}
          <div className="hidden lg:flex lg:space-x-1 lg:items-center">
            {navigationItems.map((item) => (
              item.submenu ? (
                <div key={item.name} className="relative group">
                  <button
                    className={`${
                      isActive(item.href)
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200`}
                    title={item.description}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="ml-1">▼</span>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`${
                          pathname === subItem.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        } block px-4 py-2 text-sm transition-colors duration-200`}
                        title={subItem.description}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
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
              )
            ))}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center">
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
