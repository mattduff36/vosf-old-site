import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudioDirectory from '../../components/StudioDirectory';

export default function StudiosPage() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (!authenticated || authenticated.value !== 'true') {
    redirect('/');
  }

  return <StudioDirectory />;
}
