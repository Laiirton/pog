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

    const { data: mediaData, error: mediaError } = await supabase
      .from('media_uploads')
      .select('username, upvotes, downvotes')
      .in('username', Array.from(activeUsernames))

    if (mediaError) throw mediaError;

    const userStats = mediaData.reduce((acc: Record<string, UserStats>, item) => {
      if (!acc[item.username]) {
        acc[item.username] = {
          upload_count: 0,
          upvotes: 0,
          downvotes: 0
        };
      }

      acc[item.username].upload_count += 1;
      acc[item.username].upvotes += item.upvotes || 0;
      acc[item.username].downvotes += item.downvotes || 0;

      return acc;
    }, {});

    const ranking = Object.entries(userStats)
      .map(([username, stats]) => ({
        username,
        upload_count: stats.upload_count,
        upvotes: stats.upvotes,
        downvotes: stats.downvotes
      }))
      .sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.upload_count - a.upload_count;
      })
      .slice(0, 10);

    return NextResponse.json(ranking || []);
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
