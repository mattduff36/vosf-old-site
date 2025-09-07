import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import BrowseTables from '../../components/BrowseTables';

export default function BrowsePage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <BrowseTables />
    </DashboardLayout>
  );
}
