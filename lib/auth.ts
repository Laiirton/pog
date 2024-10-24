import jwt from 'jsonwebtoken'

interface JWTPayload {
  isAdmin: boolean
}

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded.isAdmin === true
  } catch (error) {
    return false
  }
}
