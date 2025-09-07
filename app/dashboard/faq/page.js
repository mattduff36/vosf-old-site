import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import FAQBrowser from '../../components/FAQBrowser';

export default function FAQPage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <FAQBrowser />
    </DashboardLayout>
  );
}
