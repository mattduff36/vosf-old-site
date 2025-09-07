import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './components/LoginForm';

export default function Home() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth-token');
  
  if (authToken?.value) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
