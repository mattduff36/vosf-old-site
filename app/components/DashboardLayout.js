'use client';

import VOSFNavigation from './VOSFNavigation';
import { NavigationHistoryProvider } from './NavigationHistory';
import NavigationTracker from './NavigationTracker';

export default function DashboardLayout({ children }) {
  return (
    <NavigationHistoryProvider>
      <div className="min-h-screen bg-gray-50">
        <NavigationTracker />
        <VOSFNavigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </NavigationHistoryProvider>
  );
}
