import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth-token');
  return authToken?.value || null;
}

export function isAuthenticated() {
  const token = getTokenFromRequest();
  if (!token) return false;
  
  const decoded = verifyToken(token);
  return !!decoded;
}
