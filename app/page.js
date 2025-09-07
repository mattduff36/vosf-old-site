import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './components/LoginForm';

export default function Home() {
  const cookieStore = cookies();
  const authenticated = cookieStore.get('authenticated');
  
  if (authenticated && authenticated.value === 'true') {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
