import jwt from 'jsonwebtoken';

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { isAdmin: boolean };
    return decoded.isAdmin;
  } catch (error) {
    return false;
  }
}
