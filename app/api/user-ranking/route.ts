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
interface RankingData {
  username: string;
  upload_count: number;
  upvotes: number;
  downvotes: number;
}

interface MediaStats {
  username: string;
  count: number;
  sum_upvotes: number;
  sum_downvotes: number;
}

// Função auxiliar para formatar os dados do SSE
function formatSSE(data: RankingData[]) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  try {
    // Primeiro, pegamos os usuários ativos
    const { data: activeUsers, error: usersError } = await supabase
      .from('usernames')
      .select('username');

    if (usersError) throw usersError;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    // Fazemos a query diretamente na tabela media_uploads com contagem em tempo real
    const { data: mediaStats, error: mediaError } = await supabase
      .from('media_uploads')
      .select(`
        username,
        count,
        sum_upvotes,
        sum_downvotes
      `)
      .in('username', activeUsers.map(u => u.username))
      .select(`
        username,
        count:count(id),
        sum_upvotes:sum(upvotes),
        sum_downvotes:sum(downvotes)
      `)
      .groupBy('username');

    if (mediaError) {
      console.error('Media stats error:', mediaError);
      throw mediaError;
    }

    const ranking = (mediaStats || [])
      .map((stats): RankingData => ({
        username: stats.username,
        upload_count: Number(stats.count) || 0,
        upvotes: Number(stats.sum_upvotes) || 0,
        downvotes: Number(stats.sum_downvotes) || 0
      }))
      .filter(stats => stats.upload_count > 0) // Remove usuários sem uploads
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
