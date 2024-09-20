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
    // Consultando o banco de dados para obter todos os uploads de mídia, ordenados por data de criação
    const { data, error } = await supabase
      .from('media_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    // Se houver um erro na consulta, lança uma exceção
    if (error) throw error;

    // Mapeando os dados do banco para o formato desejado
    const mediaItems = data.map(item => ({
      id: item.file_id,
      title: item.file_name,
      // Determinando o tipo de mídia com base no MIME type
      type: item.mime_type.startsWith('video') ? 'video' : 'image',
      src: item.google_drive_link,
      // Usando o link de thumbnail fornecido ou gerando um do Google Drive
      thumbnail: item.thumbnail_link || `https://drive.google.com/thumbnail?id=${item.file_id}`,
      username: item.username,
      created_at: item.created_at,
    }));

    // Retornando os itens de mídia como resposta JSON
    return NextResponse.json(mediaItems);
  } catch (error) {
    // Em caso de erro, registra no console e retorna uma resposta de erro
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Error fetching media' }, { status: 500 });
  }
}