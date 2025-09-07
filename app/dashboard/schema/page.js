import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import SchemaViewer from '../../components/SchemaViewer';

export default function SchemaPage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return (
    <DashboardLayout>
      <SchemaViewer />
    </DashboardLayout>
  );
}
