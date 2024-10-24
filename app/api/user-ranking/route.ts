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

// Função para lidar com requisições GET
export async function GET() {
  try {
    const { data: activeUsers, error: usersError } = await supabase
      .from('usernames')
      .select('username')

    if (usersError) throw usersError;

    // Se não houver usuários ativos, retorna array vazio imediatamente
    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json([]);
    }

    // Criar um Set com os usernames ativos para consulta rápida
    const activeUsernames = new Set(activeUsers.map(user => user.username));

    // Agora buscamos as mídias apenas desses usuários ativos
    const { data: mediaData, error: mediaError } = await supabase
      .from('media_uploads')
      .select('username, upvotes, downvotes')
      .in('username', Array.from(activeUsernames))

    if (mediaError) throw mediaError;

    // Agregar os dados apenas dos usuários ativos
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

    // Converter para array e ordenar
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

    // Garante que sempre retorne um array, mesmo que vazio
    return NextResponse.json(ranking || []);
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
