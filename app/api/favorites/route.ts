import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET!;

// Função auxiliar para verificar o token do usuário
const verifyToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    return decoded.username;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
};

// GET: Obter favoritos do usuário
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
  }

  const username = verifyToken(token);
  if (!username) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('media_id')
      .eq('username', username);

    if (error) throw error;

    return NextResponse.json({ favorites: data.map(item => item.media_id) });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

// POST: Adicionar ou remover favorito
export async function POST(request: Request) {
  const body = await request.json();
  const { token, mediaId } = body;

  if (!token || !mediaId) {
    return NextResponse.json({ error: 'Token e mediaId são obrigatórios' }, { status: 400 });
  }

  const username = verifyToken(token);
  if (!username) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    // Verificar se o favorito já existe
    const { data: existingFavorite, error: checkError } = await supabase
      .from('user_favorites')
      .select()
      .eq('username', username)
      .eq('media_id', mediaId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingFavorite) {
      // Se existe, remover o favorito
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('username', username)
        .eq('media_id', mediaId);

      if (deleteError) throw deleteError;

      return NextResponse.json({ message: 'Favorito removido com sucesso' });
    } else {
      // Se não existe, adicionar o favorito
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert({ username, media_id: mediaId });

      if (insertError) throw insertError;

      return NextResponse.json({ message: 'Favorito adicionado com sucesso' });
    }
  } catch (error) {
    console.error('Erro ao gerenciar favorito:', error);
    return NextResponse.json({ error: 'Erro ao gerenciar favorito' }, { status: 500 });
  }
}