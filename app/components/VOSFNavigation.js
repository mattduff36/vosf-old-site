'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationHistory } from './NavigationHistory';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '🏠',
    description: 'Overview & Statistics'
  },
  {
    name: 'Studios',
    href: '/dashboard/admin',
    icon: '🎭',
    description: 'Manage Studios'
  },
  {
    name: 'FAQ',
    href: '/dashboard/admin/faq',
    icon: '❓',
    description: 'Manage FAQ'
  }
];

export default function VOSFNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { goBack, goForward, canGoBack, canGoForward } = useNavigationHistory();

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleBack = () => {
    const previousEntry = goBack();
    if (previousEntry) {
      router.push(previousEntry.path);
    }
  };

  const handleForward = () => {
    const nextEntry = goForward();
    if (nextEntry) {
      router.push(nextEntry.path);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side - Navigation Controls */}
          <div className="flex items-center space-x-2">
            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={!canGoBack}
              className={`inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                canGoBack
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Go Back"
            >
              <span className="text-lg">←</span>
            </button>
            
            {/* Forward Button */}
            <button
              onClick={handleForward}
              disabled={!canGoForward}
              className={`inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                canGoForward
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title="Go Forward"
            >
              <span className="text-lg">→</span>
            </button>
          </div>

          {/* Center - Main Navigation */}
          <div className="hidden lg:flex lg:space-x-1 lg:items-center">
            {navigationItems.map((item) => (
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
        {/* Mobile Navigation Controls */}
        <div className="flex items-center justify-center space-x-4 py-2 border-b border-gray-100">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              canGoBack
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Go Back"
          >
            <span className="text-lg mr-1">←</span>
            <span className="text-xs">Back</span>
          </button>
          
          <button
            onClick={handleForward}
            disabled={!canGoForward}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              canGoForward
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Go Forward"
          >
            <span className="text-xs mr-1">Forward</span>
            <span className="text-lg">→</span>
          </button>
        </div>
        
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
