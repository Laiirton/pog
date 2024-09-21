import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  try {
    // Verificar o token
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}