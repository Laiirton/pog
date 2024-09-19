import type { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return NextResponse.json({ token });
  } else {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}