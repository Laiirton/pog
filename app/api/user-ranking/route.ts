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
      .select('username')

    if (usersError) throw usersError;

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    const activeUsernames = new Set(activeUsers.map(user => user.username));

    // Modificando a query para usar count e sum
    const { data: mediaStats, error: mediaError } = await supabase
      .from('media_uploads')
      .select(`
        username,
        count(*) as upload_count,
        sum(upvotes) as upvotes,
        sum(downvotes) as downvotes
      `)
      .in('username', Array.from(activeUsernames)) as unknown as {
        data: {
          username: string;
          upload_count: number;
          upvotes: number;
          downvotes: number;
        }[] | null;
        error: any;
      };

    if (mediaError) throw mediaError;

    // Convertendo os resultados para o formato esperado
    const ranking = (mediaStats || [])
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
    console.error('Error fetching user ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
