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
  total_score: number;
  last_updated: string;
}

export async function GET() {
  try {
    // Buscar ranking direto da tabela user_rankings
    const { data: ranking, error } = await supabase
      .from('user_rankings')
      .select('*')
      .order('total_score', { ascending: false })
      .order('upload_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Forçar atualização do ranking
    await supabase.rpc('refresh_all_rankings');

    return NextResponse.json(ranking || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}
