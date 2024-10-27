/* eslint-disable @typescript-eslint/no-unused-vars */

// Importando as dependências necessárias
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criando um cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Definindo o tipo de dados para o ranking
interface RankingData {
  username: string;
  upload_count: number;
  upvotes: number;
  downvotes: number;
}

export async function GET() {
  try {
    // Habilita o Realtime para a tabela media_uploads
    await supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_uploads' },
        () => {
          console.log('Database change detected');
        }
      )
      .subscribe();

    // Busca usuários ativos
    const { data: activeUsers, error: usersError } = await supabase
      .from('usernames')
      .select('username');

    if (usersError) throw usersError;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    // Query otimizada com agregações
    const { data: mediaStats, error: mediaError } = await supabase
      .rpc('get_user_ranking', {
        user_list: activeUsers.map(u => u.username)
      });

    if (mediaError) {
      console.error('Media stats error:', mediaError);
      throw mediaError;
    }

    const ranking = (mediaStats as RankingData[])
      .filter(stats => stats.upload_count > 0)
      .sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.upload_count - a.upload_count;
      })
      .slice(0, 10);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
