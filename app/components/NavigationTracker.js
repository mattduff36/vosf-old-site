'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationHistory } from './NavigationHistory';

// Map of paths to user-friendly titles
const pathTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/admin': 'Studio Management',
  '/dashboard/admin/faq': 'FAQ Management',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/browse': 'Browse Tables',
  '/dashboard/faq': 'FAQ',
  '/dashboard/network': 'Network',
  '/dashboard/query': 'SQL Query',
  '/dashboard/schema': 'Database Schema',
  '/dashboard/studios': 'Studios',
  '/dashboard/venues': 'Venues'
};

export default function NavigationTracker() {
  const pathname = usePathname();
  const { pushToHistory } = useNavigationHistory();

  useEffect(() => {
    // Get title for current path
    let title = pathTitles[pathname];
    
    // Handle dynamic routes
    if (!title) {
      if (pathname.startsWith('/dashboard/studios/')) {
        title = 'Studio Profile';
      } else if (pathname.startsWith('/dashboard/admin')) {
        title = 'Admin Panel';
      } else {
        title = pathname.split('/').pop() || 'Page';
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }
    }

    // Push to navigation history
    pushToHistory(pathname, title);
  }, [pathname, pushToHistory]);

  return null; // This component doesn't render anything
}
