import bcrypt from 'bcryptjs';

export function validateCredentials(username, password) {
  const validUsername = process.env.AUTH_USERNAME || 'admin';
  const validPassword = process.env.AUTH_PASSWORD || 'password';
  
  return username === validUsername && password === validPassword;
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}
