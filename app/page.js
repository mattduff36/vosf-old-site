import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './components/LoginForm';

export default function Home() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth-token');
  
  // Debug logging for production
  console.log('Home page - Auth token exists:', !!authToken?.value);
  console.log('Home page - Environment:', process.env.NODE_ENV);
  
  if (authToken?.value) {
    console.log('Home page - Redirecting to dashboard');
    redirect('/dashboard');
  }

  return <LoginForm />;
}
