import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DatabaseExplorer from '../components/DatabaseExplorer';

export default function Dashboard() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return <DatabaseExplorer />;
}
