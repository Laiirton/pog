import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Inicialize o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');

  if (!mediaId) {
    return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('media_id', mediaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mediaId, username, content } = await req.json();

    if (!mediaId || !username || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decodificar o token JWT para extrair o nome de usuário
    let decodedUsername;
    try {
      const decoded = jwt.decode(username);
      console.log('Decoded token:', decoded); // Adiciona log para verificar o conteúdo do token decodificado
      if (typeof decoded === 'object' && decoded !== null && 'username' in decoded) {
        decodedUsername = decoded.username;
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.json({ error: 'Invalid username token' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ media_id: mediaId, username: decodedUsername, content })
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}