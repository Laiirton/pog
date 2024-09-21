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
    // Consultando o banco de dados para obter o ranking de usuários
    const { data, error } = await supabase
      .from('media_uploads')
      .select('username, upvotes, downvotes')

    // Se houver um erro na consulta, lança uma exceção
    if (error) throw error;

    // Agregar os dados por usuário
    const userStats = data.reduce((acc: Record<string, UserStats>, item) => {
      if (!acc[item.username]) {
        acc[item.username] = { upload_count: 0, upvotes: 0, downvotes: 0 };
      }
      acc[item.username].upload_count++;
      acc[item.username].upvotes += item.upvotes;
      acc[item.username].downvotes += item.downvotes;
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
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || b.upload_count - a.upload_count)
      .slice(0, 10); // Pegar os top 10

    // Retorna os dados como resposta JSON
    return NextResponse.json(ranking);
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error fetching user ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}