/* eslint-disable @typescript-eslint/no-unused-vars */

// Importando as dependências necessárias
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criando um cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Definindo o tipo de dados para o ranking
interface UserStats {
  upload_count: number;
  upvotes: number;
  downvotes: number;
}

interface RankingData {
  username: string;
  upload_count: number;
  upvotes: number;
  downvotes: number;
}

// Função auxiliar para formatar os dados do SSE
function formatSSE(data: RankingData[]) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  try {
    const { data: activeUsers, error: usersError } = await supabase
      .from('usernames')
      .select('username');

    if (usersError) throw usersError;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    const activeUsernames = new Set(activeUsers.map(user => user.username));

    // Query corrigida usando a sintaxe correta do PostgREST
    const { data: mediaStats, error: mediaError } = await supabase
      .from('media_uploads')
      .select('username, upload_count:count(*), upvotes:sum(upvotes), downvotes:sum(downvotes)')
      .in('username', Array.from(activeUsernames))
      .groupBy('username');

    if (mediaError) {
      console.error('Media stats error:', mediaError);
      throw mediaError;
    }

    if (!mediaStats) {
      console.log('No media stats found');
      return NextResponse.json([]);
    }

    const ranking = mediaStats
      .map(stats => ({
        username: stats.username,
        upload_count: Number(stats.upload_count) || 0,
        upvotes: Number(stats.upvotes) || 0,
        downvotes: Number(stats.downvotes) || 0
      }))
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
