import jwt from 'jsonwebtoken'

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return (decoded as any).isAdmin === true
  } catch (error) {
    return false
  }
}
