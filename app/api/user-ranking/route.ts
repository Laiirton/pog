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
    const { data: activeUsers, error: usersError } = await supabase
      .from('usernames')
      .select('username')
      .order('username');  // Adiciona ordenação para consistência

    if (usersError) throw usersError;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    // Usando uma função RPC personalizada para fazer a agregação
    const { data: mediaStats, error: mediaError } = await supabase
      .rpc('get_user_stats', {
        user_list: activeUsers.map(u => u.username)
      });

    if (mediaError) {
      console.error('Media stats error:', mediaError);
      throw mediaError;
    }

    const ranking = (mediaStats || [])
      .map((stats: any) => ({
        username: stats.username,
        upload_count: Number(stats.upload_count) || 0,
        upvotes: Number(stats.upvotes) || 0,
        downvotes: Number(stats.downvotes) || 0
      }))
      .filter((stats: RankingData) => stats.upload_count > 0)
      .sort((a: RankingData, b: RankingData) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.upload_count - a.upload_count;
      })
      .slice(0, 10);

    // Configura headers para prevenir cache
    return new NextResponse(JSON.stringify(ranking), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
