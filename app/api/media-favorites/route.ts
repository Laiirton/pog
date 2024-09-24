import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicialize o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log(`Iniciando a busca de favoritos${username ? ` para o usuário: ${username}` : ''}`);

    let query = supabase
      .from('user_favorites')
      .select('media_id');

    if (username) {
      query = query.eq('username', username);
    }

    const { data: favoritesData, error: favoritesError } = await query;

    if (favoritesError) throw favoritesError;

    const mediaCount = {} as Record<string, { count: number; file_name: string }>;

    for (const { media_id } of favoritesData) {
      if (!mediaCount[media_id]) {
        // Buscar o nome do arquivo da tabela media_uploads
        const { data: mediaData, error: mediaError } = await supabase
          .from('media_uploads')
          .select('file_name')
          .eq('file_id', media_id)
          .single();

        if (mediaError) throw mediaError;

        mediaCount[media_id] = {
          count: 0,
          file_name: mediaData?.file_name || 'Nome não disponível'
        };
      }
      mediaCount[media_id].count += 1;
    }

    console.log('Dados formatados:', mediaCount);

    return NextResponse.json(mediaCount);
  } catch (error) {
    console.error('Erro detalhado ao buscar favoritos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar favoritos', details: error instanceof Error ? error.message : JSON.stringify(error) },
      { status: 500 }
    );
  }
}