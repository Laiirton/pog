/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Função para lidar com requisições GET
export async function GET(request: NextRequest) {
  // Extrair o username dos parâmetros da requisição
  const username = request.nextUrl.searchParams.get('username');

  try {
    if (username) {
      // Se um username específico for fornecido, buscar apenas os votos desse usuário
      console.log(`Buscando votos do usuário: ${username}`);
      const { data: user, error: userError } = await supabase
        .from('usernames')
        .select('username, votes')
        .eq('username', username)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        throw userError;
      }

      console.log('Dados do usuário:', user);

      if (!user || !user.votes) {
        // Se o usuário não tiver votos, retornar um objeto vazio
        return NextResponse.json({ user: { username, votes: [] } });
      }

      // Obter os IDs das mídias votadas pelo usuário
      const mediaIds = Object.keys(user.votes);

      console.log('Buscando mídias:', mediaIds);
      const { data: media, error: mediaError } = await supabase
        .from('media_uploads')
        .select('file_id, file_name, mime_type, username, created_at, google_drive_link, thumbnail_link, vote_count, upvotes, downvotes')
        .in('file_id', mediaIds);

      if (mediaError) {
        console.error('Erro ao buscar mídias:', mediaError);
        throw mediaError;
      }

      console.log('Dados das mídias:', media);

      // Criar um mapa das mídias para facilitar a associação com os votos
      const mediaMap = new Map(media.map(m => [m.file_id, m]));

      // Associar os votos do usuário com as informações das mídias
      const userWithMedia = {
        username: user.username,
        votes: Object.entries(user.votes).map(([mediaId, voteType]) => ({
          ...mediaMap.get(mediaId),
          voteType
        }))
      };

      // Retornar os dados do usuário com as mídias votadas
      return NextResponse.json({ user: userWithMedia });
    } else {
      // Se nenhum username for fornecido, buscar os votos de todos os usuários
      console.log('Buscando todos os usuários e seus votos');
      const { data: users, error: userError } = await supabase
        .from('usernames')
        .select('username, votes');

      if (userError) {
        console.error('Erro ao buscar usuários:', userError);
        throw userError;
      }

      console.log('Dados dos usuários:', users);

      if (!users || users.length === 0) {
        // Se não houver usuários, retornar uma lista vazia
        return NextResponse.json({ users: [] });
      }

      // Obter todos os IDs das mídias votadas por todos os usuários
      const mediaIds = new Set<string>();
      users.forEach(user => {
        Object.keys(user.votes).forEach(mediaId => mediaIds.add(mediaId));
      });

      console.log('Buscando mídias:', Array.from(mediaIds));
      const { data: media, error: mediaError } = await supabase
        .from('media_uploads')
        .select('file_id, file_name, mime_type, username, created_at, google_drive_link, thumbnail_link, vote_count, upvotes, downvotes')
        .in('file_id', Array.from(mediaIds));

      if (mediaError) {
        console.error('Erro ao buscar mídias:', mediaError);
        throw mediaError;
      }

      console.log('Dados das mídias:', media);

      // Criar um mapa das mídias para facilitar a associação com os votos
      const mediaMap = new Map(media.map(m => [m.file_id, m]));

      // Associar os votos dos usuários com as informações das mídias
      const usersWithMedia = users.map(user => ({
        username: user.username,
        votes: Object.entries(user.votes).map(([mediaId, voteType]) => ({
          ...mediaMap.get(mediaId),
          voteType
        }))
      }));

      // Retornar os dados dos usuários com as mídias votadas
      return NextResponse.json({ users: usersWithMedia });
    }
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return NextResponse.json({ error: 'An error occurred while fetching votes' }, { status: 500 });
  }
}
