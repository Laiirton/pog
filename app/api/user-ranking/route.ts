/* eslint-disable @typescript-eslint/no-unused-vars */

// Importando as dependências necessárias
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TransformStream } from 'node:stream/web';

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

// Função auxiliar para formatar os dados do SSE
function formatSSE(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const { headers } = request;
  
  // Verifica se o cliente aceita SSE
  if (headers.get('accept') === 'text/event-stream') {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Inicia a conexão SSE
    const response = new Response(stream.readable as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Função para buscar e enviar dados do ranking
    const sendRankingUpdate = async () => {
      try {
        const { data: activeUsers } = await supabase
          .from('usernames')
          .select('username');

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

        // Envia os dados através do stream
        const message = formatSSE(ranking);
        await writer.write(encoder.encode(message));
      } catch (error) {
        console.error('Error in ranking update:', error);
      }
    };

    // Envia atualização inicial
    await sendRankingUpdate();

    // Inscreve-se nas mudanças da tabela
    const subscription = supabase
      .channel('ranking-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'media_uploads' },
        async () => {
          await sendRankingUpdate();
        }
      )
      .subscribe();

    // Limpa a conexão quando o cliente desconecta
    request.signal.addEventListener('abort', () => {
      subscription.unsubscribe();
      writer.close();
    });

    return response;
  }

  // Fallback para requisição normal se não for SSE
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
