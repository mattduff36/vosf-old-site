import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import VenueBrowser from '../../components/VenueBrowser';

export default function VenuesPage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <VenueBrowser />
    </DashboardLayout>
  );
}
