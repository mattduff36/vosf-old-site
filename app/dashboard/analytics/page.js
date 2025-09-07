import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';

export default function AnalyticsPage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
