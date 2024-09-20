/* eslint-disable @typescript-eslint/no-unused-vars */

// Importando as dependências necessárias
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criando um cliente Supabase com as credenciais do ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para lidar com requisições GET
export async function GET() {
  try {
    // Consultando o banco de dados para obter o ranking de usuários
    const { data, error } = await supabase
      .from('usernames')
      .select('username, upload_count')
      .order('upload_count', { ascending: false }) // Ordenando por contagem de uploads em ordem decrescente
      .limit(10); // Limitando o resultado aos 10 primeiros

    // Se houver um erro na consulta, lança uma exceção
    if (error) throw error;

    // Retorna os dados como resposta JSON
    return NextResponse.json(data);
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error fetching user ranking:', error);
    return NextResponse.json({ error: 'Error fetching user ranking' }, { status: 500 });
  }
}